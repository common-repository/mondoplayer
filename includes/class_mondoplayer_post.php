<?php

/**
 * Copyright (C) 2018 MondoPlayer.com, all rights reserved
 *
 * @link       https://www.mondoplayer.com
 * @since      1.0.0
 *
 * @package    mondoplayer
 * @subpackage mondoplayer/includes
 * @author     MondoPlayer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MondoPlayer_Post {
	public $autopilot_url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";
	public $readability_url = "https://plugin.mondoplayer.com/api/parse/html";
	public $user_agent = "request";
	public $backup_user_agent = "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36";
	public $min_size = 4500;
	public $server_id = "";

	function __construct() {
		$this->server_id = gethostname();
	}

	function get_autopilot_object($license_key, $autopilot_id) {
		$params = array(
			'method'	=> 'POST',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
			'body'		=> array (
				'id'			=> $license_key,
				'wp_autopilot'	=> $autopilot_id,
				'server_id'		=> $this->server_id,
			)
		);

		$response = wp_remote_post($this->autopilot_url, $params );
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error getting autopilot object: $error_message");
			return;
		}
		return json_decode(wp_remote_retrieve_body($response));
	}

	function check_special_domain($domain, $query_string) {
		global $wpdb;

		if (strpos($domain, "/") > 0) {
			if (parse_url($domain, PHP_URL_HOST)) {
				$domain = parse_url($domain, PHP_URL_HOST);
			} else {
				$domain = substr($domain, 0, strpos($domain, "/"));
			}
		}
		#error_log("Checking domain $domain");
		$found = false;
		$result = $wpdb->get_results("SELECT search_url, DATEDIFF(CURDATE(), update_date) as days FROM wp_mondoplayer_special_domains WHERE domain = '$domain' limit 1");
		if ($result) {
			#error_log("found domain $domain");
			if (sizeof($result) > 0 && $result[0]->search_url != "" && $result[0]->days < 30) {
				$search_url = $wpdb->get_results("SELECT search_url FROM wp_mondoplayer_special_domains WHERE domain = '$domain' AND search = '" . addslashes($query_string) . "' limit 1");
				error_log("found search_url " . sizeof($search_url));

				if ($search_url && sizeof($search_url) > 0) {
					return $search_url[0]->search_url;
				}
			}
			if (sizeof($result) > 0 && $result[0]->search_url == "" && $result[0]->days < 7) {
				#error_log("Skipping search_url age " . $result[0]->days);
				return "";
			}
		}
		$params = array(
			'method'	=> 'GET',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
		);
		$search_url = "";
		$request_url = "http://167.99.233.169:3030/api/parse/domain/" . $domain . "/" . urlencode($query_string);

		#error_log("Search url check $request_url");
		$response = wp_remote_get($request_url, $params );
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error getting special domain search string: $error_message");
		} else {
			#error_log("Search url response " . wp_remote_retrieve_body($response));
			$response_body = json_decode(wp_remote_retrieve_body($response));
			if (! is_object($response_body) || !isset($response_body->url)) {
				error_log("Error getting special Domain search string: ". wp_remote_retrieve_body($response));
			} else {
				$search_url = $response_body->url;
			}
		}

		$wpdb->get_results("DELETE FROM wp_mondoplayer_special_domains WHERE domain = '$domain'");
		$wpdb->get_results("INSERT INTO wp_mondoplayer_special_domains (domain, search, update_date, search_url) VALUES ('$domain', '". addslashes($query_string)."', NOW(), '" . addslashes($search_url) . "')");
		return $search_url;
	}

	function special_domain_search($search_url) {
		$params = array(
			'method'	=> 'GET',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
		);
		$response = wp_remote_get($search_url, $params);
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error getting special domain search html: $error_message");
			return "";
		}

		error_log("Fetching search_url $search_url");

		$data = array("registrationKey"=>get_option('mondoplayer_license_key'), "url"=> $search_url);
		$data['html'] = base64_encode(wp_remote_retrieve_body($response));
		$data_string = json_encode($data);
		#error_log("search fetch body:" . $data_string);
 		$params = array(
			'method'	=> 'POST',
			'timeout'	=> 40,
			'blocking'	=> true,
			'sslverify'	=> false,
			'header'	=> array (
				'content-type'		=> 'application/json',
				'content-length'	=>  strlen($data_string),
			),
			'body'	=> $data,
		);
		$request_url = "http://167.99.233.169:3030/api/parse/search/";
		$response = wp_remote_post($request_url, $params);
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error getting special domain search list: $error_message");
			return "";
		}
		error_log("Special domain search_list: " . wp_remote_retrieve_body($response));
		$response_body = json_decode(wp_remote_retrieve_body($response));
		if (! is_object($response_body) || !isset($response_body->videos)) {
			error_log("Error getting special domain search list: ". wp_remote_retrieve_body($response));
			return "";
		}

		$urls = array();
		for ($i = 0; $i < sizeof($response_body->videos); $i++) {
			$urls[] = $response_body->videos[$i]->url;
		}
		return $urls;
	}

	function finish_pending_posts() {
		$posts_array = array(
			'post_status' => array('draft'),
			'meta_key' => 'mondoplayer_images',
		);
		$posts = get_posts( $posts_array);
		foreach ($posts as $post) {
			error_log("Finish Pending: " . $post->ID);
			$images = json_decode(get_post_meta($post->ID, 'mondoplayer_images', true));

			#error_log("Images: " . $images->tries);

			if ($images === null || $images->tries > 1) {
				$this->delete_post($post->ID, 1);
			} else {
				$images->tries++;
				update_post_meta($post->ID, "mondoplayer_images", json_encode($images));
				$this->finish_post($post->ID, $images);
			}
		}
	}

	function get_object($object_id, $object_url, $categories, $title, $status, $autopilot_id, $search_terms, $thumbnail, $user, $hashtags, $description, $thumbnail_url = "", $embedVideo = "") {
		$license_key = get_option('mondoplayer_license_key');
		$max_words = get_option('mondoplayer_max_words', 150);
		$is_subscribed = get_option('mondoplayer_is_subscribed');
		$is_trial = get_option('mondoplayer_is_trial');
		$trusted_domains = explode("|", get_option( 'mondoplayer_trusted_domains', '' ));
		$theme_check = wp_get_theme('videobox');

		$output = "";
		#error_log("Post user: " . $user);
		if ($user == null || $user < 1) {
			$user = 1;
		}
		if ($is_subscribed == 0 || $is_trial == 1) {
			$comparison = "=";
			if ($autopilot_id > 0) {
				$comparison = "!=";
			}
			$min_date = date('Y-m-d', strtotime("-7 days"));
			$posts_array = array(
				'date_query' => array(
					'after' => $min_date,
				),
				'meta_query' => array(
					array(
						'key' => 'mondoplayer_autopilot',
						'value' => '0',
						'compare' => $comparison,
					),
				),
			);
			$post_query = new WP_Query($posts_array);
			#error_log("post_query: " . json_encode($post_query));
			if ($post_query->found_posts > 0) {
				return "limit";
			}
		}
		$posts_array = array(
			'meta_key' => 'mondoplayer_origional_url',
			'meta_value' => $object_url,
		);

		$object_domain = parse_url($object_url, PHP_URL_HOST);

		$post_query = new WP_Query($posts_array);
		if ($post_query->found_posts > 0) {
			error_log("Found " . $post_query->found_posts . " matching posts, skipping");
			return "url";
		}
		$search_split = array();
		preg_match_all('/"(?:\\\\.|[^\\\\"])*"|\S+/', $search_terms, $search_split);

		$params = array(
			'method'	=> 'GET',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
		);

		$object_block_embed = 0;
		$response = wp_remote_get($object_url, $params );
		if (isset($response['headers']['X-Frame-Options'])) {
			$object_block_embed = 1;
		}
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error getting object html: $error_message");
			$this->send_posted_code($object_id, 2);
			return "error getting object html: $error_message";
		}
		if ($response['response']['code'] == "403") {
			$params['header']['user-agent'] = $this->backup_user_agent;
			$response = wp_remote_get($object_url, $params );
			if ( is_wp_error( $response ) ) {
				$error_message = $response->get_error_message();
				error_log("Error fetching file $object_url: $error_message");
				#error_log(wp_remote_retrieve_body($response));
				$this->send_posted_code($object_id, 3);
				return;
			}
		} else if ($response['response']['code'] == "429" && preg_match('/youtube.com/', $object_url)) {
			error_log("Error fetching file $object_url ". $response['response']['code']);
			$object_html = "<html><head><title>$title</title><description>$description</></head><body><p>$description</p></body></html>";
		} else if ($response['response']['code'] != 200) {
			error_log("Error fetching file $object_url ". $response['response']['code']);
			$this->send_posted_code($object_id, 4);
			return;
		} else {
			$object_html = wp_remote_retrieve_body($response);

			if ($object_html) {
				if (! preg_match('/youtube/',$object_url)) {
					//$startpos = mb_strpos($object_html, "<script");
					//while ($startpos > 0) {
					//	$endpos = mb_strpos($object_html, '</script>', $startpos);
					//	if ($endpos < $startpos) {
					//		break;
					//	}
					//	$object_html = mb_substr($object_html, 0, $startpos) . mb_substr($object_html, $endpos + 9);
					//	$startpos = mb_strpos($object_html, "<script");
					//}
				}
				$test = false;
				if (! preg_match("/youtube/", $search_terms)) {
					for ($t = 0; $t < sizeof($search_split[0]); $t++) {
						$term = $search_split[0][$t];
						if ($search_split[0][$t] == "" || $search_split[0][$t] == "OR") {
							continue;
						}
						if (isset($search_split[0][$t + 1]) && $search_split[0][$t + 1] == "OR") {
							continue;
						}
						if (isset($search_split[0][$t - 1]) && $search_split[0][$t - 1] == "OR") {
							continue;
						}
						if (preg_match("/\w\w\.\w\w/", $term)) {
							continue;
						}
						$term = str_replace('"', "", $term);
						if (strpos("-", $term) == 0) {
							if (strpos(substr($term, 1), $object_html) > 0) {
								return;
							}
						} else if (strpos($term, $object_html) === false) {
							return;
						}
					}
				}

				$startpos = mb_strpos($object_html, "<style");
				while ($startpos > 0) {
					$endpos = mb_strpos($object_html, '</style>', $startpos);
					if ($endpos < $startpos) {
						break;
					}
					$object_html = mb_substr($object_html, 0, $startpos) . mb_substr($object_html, $endpos + 8);
					$startpos = mb_strpos($object_html, "<style");
				}
			}
		}
		$cookies = $response['cookies'];

		if ($object_html) {
			$images_names = array();

			$data = array(
				"objectId" => $object_id,
				"registrationKey" =>$license_key,
				"url" => $object_url,
				"html" => base64_encode($object_html)
			);

			$requires_thumbnail = 0;
			$category_list = array();
			for ($i = 0; $i < sizeof($categories); $i++) {
				$category_list[] = intval($categories[$i]->term_id);
			}
			#error_log("category_list: " . json_encode($category_list));
			$read_more = "";
			$post_status = "draft";
			if (sizeof($categories) > 0) {
				$category_meta = get_term_meta($categories[0]->term_id, '', true);
				if (isset($category_meta['mondoplayer_pending'][0])) {
					#error_log("Category $post_status " . $categories[0]->term_id . " - " . $category_meta['mondoplayer_pending'][0]);
				} else {
					#error_log("Category $post_status " . $categories[0]->term_id . " - not mondoplayer");
				}
				if (isset($category_meta['mondoplayer_pending'][0]) && $category_meta['mondoplayer_pending'][0] == 1) {
					$post_status = "publish";
				} else if (isset($category_meta['mondoplayer_pending'][0]) && $category_meta['mondoplayer_pending'][0] == 2) {
					for ($i = 0; $i < sizeof($trusted_domains); $i++) {
						if (strlen($trusted_domains[$i]) < 3) {
							continue;
						}
						if ((substr($trusted_domains[$i], 0, 12) == "youtube user" || substr($trusted_domains[$i], 0, 15) == "youtube channel") && $trusted_domains[$i] == $search_terms) {
							$post_status = "publish";
							break;
						} else if (strpos($object_domain, $trusted_domains[$i]) > -1) {
							$post_status = "publish";
							break;
						}
					}
				}
				if (isset($category_meta['mondoplayer_video_thumbnail'][0])) {
					$requires_thumbnail = $category_meta['mondoplayer_video_thumbnail'][0];
				}
				if (isset($category_meta['mondoplayer_max_words'][0])) {
					$max_words = $category_meta['mondoplayer_max_words'][0];
				}
			}
			error_log("post_status $post_status");

			if (trim($max_words) !== "" && $max_words > 0) {
				$data['maxWords'] = $max_words;
			}
			if (preg_match('/&anchor/i', $search_terms) || preg_match('/&vlog/i', $search_terms)) {
				$data['anchorRequired'] = true;
			}
			$data['embedVideo'] = $embedVideo;
			$data['thumbnail'] = $thumbnail_url;
			$data_string = json_encode($data);
			$params = array(
				'method'	=> 'POST',
				'timeout'	=> 40,
				'blocking'	=> true,
				'sslverify'	=> false,
				'header'	=> array (
					'content-type'		=> 'application/json',
					'content-length'	=>  strlen($data_string),
				),
				'body'	=> $data,
			);

			$response = wp_remote_post($this->readability_url, $params );
			if ( is_wp_error( $response ) ) {
				$error_message = $response->get_error_message();
				error_log("Error processing object html: $error_message");
				$this->send_posted_code($object_id, 5);
				return "error processing object html: $error_message";
			}
			$body = wp_remote_retrieve_body($response);

			#error_log("Readability: " . json_encode($params) . "\n" . $body);


			$readability = array();
			if (trim($body) == "") {
				error_log("Error readability returned empty");
				$readability->errorCode = "1";
			} else {
				$readability = json_decode($body);
				if (!isset($readability->content)) {
					error_log("Error no content: " . $body);
					$readability = (object) array(
						'content'		=> "",
						'description'	=> "",
						'errorCode'		=> "1",
					);
				} else {
					preg_replace('/itemtype="http:\/\/schema.org\/VideoObject"/i', '', $readability->content);
				}
			}

			#error_log("response: " . json_encode($response));
			if (isset($readability->errorCode) && $readability->errorCode > 0) {
				$params = array(
					'method'	=> 'POST',
					'timeout'	=> 40,
					'blocking'	=> true,
					'header'	=> array (
						'user-agent'	=> $this->user_agent,
					),
					'body'		=> array (
						'id'		 => $license_key,
						'flag_object'=> $object_id,
						"error_code" => $readability->errorCode,
						'server_id'	 => $this->server_id,
					)
				);

				wp_remote_post($this->autopilot_url, $params);
				$this->send_posted_code($object_id, 6);
				return "error readability " . $readability->errorCode;
			}
			if (isset($readability->contentVideos) && sizeof($readability->contentVideos) > 0) {
				if ($autopilot_id > 0) {
					$params = array(
						'meta_key' => 'mondoplayer_embed_code',
						'meta_value' => $readability->contentVideos[0],
						'post_type' => 'post',
						'post_status' => 'publish',
						'posts_per_page' => -1
					);
					$test = get_posts($params);

					if (sizeof($test) > 0) {
						wp_set_post_categories($test[0]->ID, $category_list, true);
						$time = current_time('mysql');
						$params = array (
							'ID' => $test[0]->ID,
      						'post_date'     => $time,
							'post_date_gmt' => get_gmt_from_date( $time )
						);
						wp_update_post($params);
						error_log("Updating object - " . $test[0]->ID);
						return;
					}
				}
			} else {
				if (preg_match('/&embed/i', $search_terms)) {
					error_log("No embed url, skipping: " . $object_url);
					return;
				}
				if ($object_block_embed == 1 && (preg_match('/&anchor/i', $search_terms) || preg_match('/&vlog/i', $search_terms))) {
					error_log("Object missing anchor, skipping: " . $object_url);
					return;
				}

				if ((preg_match('/&anchor/i', $search_terms) || preg_match('/&vlog/i', $search_terms)) && ! isset($readability->anchor)) {
					error_log("Object missing anchor, skipping: " . $object_url);
					return;
				}
			}

			if ($thumbnail !== null) {
				$requires_thumbnail = $thumbnail;
			}
			if ($status != "") {
				$post_status = $status;
			}
			if (isset($readability->description) && $readability->title != null && $readability->title != "") {
				$title = $readability->title;
			}
			$title = html_entity_decode($title, ENT_QUOTES | ENT_XML1, 'UTF-8');

			if (!isset($readability->description) || $readability->description == null) {
				$readability->description = "";
			}
			if (preg_match('/https:\/\/video.foxnews.com\/v\/(\w*)/',$object_url, $matches)) {
				#$readability->content = $iframe . $readability->content;
				$readability->hasEmbeddedVideo = true;
			} else if (! $theme_check->exists() && sizeof($readability->contentVideos) > 0) {
				if (strpos($readability->contentVideos[0], "<iframe") === false) {
					if (strpos($readability->content, $readability->contentVideos[0]) === false) {
						#$readability->content = '<iframe width="420" height="315" src="' . $readability->contentVideos[0] . '"></iframe> ' . $readability->content;
						$readability->hasEmbeddedVideo = true;
					}
				} else {
					preg_match("/src=['\"](.*?)['\"]/",$readability->contentVideos[0], $matches);
					if (sizeof($matches)> 0) {
						if (strpos($readability->content, $matches[1]) === false) {
							#$readability->content = $readability->contentVideos[0] . $readability->content;
							$readability->hasEmbeddedVideo = true;
						}
					}
				}
			}

			if (preg_match('/youtube.com/',$object_url)) {
				$readability->hasEmbeddedVideo = true;
			}

			$readability->content .= "<div id='mp_wrapper_24dh'></div>";
			$exclude_tags = explode("|", get_option("mondoplayer_exclude_meta_tags", ""));
			for ($t = 0; $t < sizeof($exclude_tags); $t++) {
				if (strpos(" ", $exclude_tags[$t]) !== false) {
					$exclude_tags[] = str_replace(" ", "", $exclude_tags[$t]);
				}
			}
			if (isset($readability->tags) && sizeof($readability->tags) > 0) {
				for ($i = 0; $i < sizeof($readability->tags); $i++) {
					if ($readability->tags[$i] != "") {
						if (in_array(preg_replace('/ /g', '', strtolower($readability->tags[$i])), $exclude_tags)) {
							continue;
						}
						$readability->tags[$i] = preg_replace('/([a-z])([A-Z])/',"$1 $2", $readability->tags[$i]);
						$readability->content .= '<meta property="article:tag" content="' . $readability->tags[$i] . '" />';
					}
				}
			}
			if (strpos($title, '[Video]') < 1) {
				$title .= " [Video]";
			}
			error_log("clean title: " . $title);
			$content = "";
			if (isset($readability->content) && ! is_null($readability->content) ) {
				$content = $readability->content;
			}
			$vlog_check = wp_get_theme();
			if ($vlog_check->get('Name') == "MondoPlayer Theme") {
				$content = preg_replace("/<iframe.*<\/iframe>/", '', $content);
			}

			$excerpt = "";
			if (isset($readability->description) && ! is_null($readability->description) ) {
				$excerpt = $readability->description;
			}

			if ($content == "") {
				$content = $excerpt;
			}

			$excerpt = strip_tags($excerpt); 

			$post = array(
				'post_content' => $content,
				'post_title' => $title,
				'post_excerpt' => $excerpt,
				'post_category' => $category_list,
				'post_status' => 'draft',
				'post_author' => $user,
			);
			kses_remove_filters();
			$post_id = wp_insert_post($post);
			error_log("Post ID: " . $post_id . " - " . $object_id);

			if ($post_id) {
				$output = "Created post $post_id";
				add_post_meta($post_id, "mondoplayer_object", true, true);
				add_post_meta($post_id, "mondoplayer_autopilot_id", $autopilot_id, true);
				add_post_meta($post_id, "mondoplayer_origional_url", $object_url, true);
				add_post_meta($post_id, "mondoplayer_search_terms", $search_terms, true);
				$embed_search = 0;
				$anchor_search = 0;
				if (preg_match('/&embed/i', $search_terms)) {
					$embed_search = 1;
				}
				if (preg_match('/&anchor/i', $search_terms)) {
					$anchor_search = 1;
				}
				if (preg_match('/&vlog/i', $search_terms)) {
					$embed_search = 1;
					$anchor_search = 1;
				}
				add_post_meta($post_id, "mondoplayer_embed_search", $embed_search, true);
				add_post_meta($post_id, "mondoplayer_anchor_search", $anchor_search, true);

				$anchor = "";
				if (isset($readability->anchor) && $readability->anchor != "") {
					$anchor = $readability->anchor;
				}
				add_post_meta($post_id, "mondoplayer_embed_anchor", $anchor, true);
				add_post_meta($post_id, "mondoplayer_object_id", $object_id, true);
				add_post_meta($post_id, "mondoplayer_embedded", $readability->hasEmbeddedVideo, true);
				add_post_meta($post_id, "mondoplayer_pin_blog", 1, true);
				add_post_meta($post_id, "mondoplayer_pin_slider", 1, true);
				if ($hashtags != "") {
					#error_log("filter hashtags: " . $hashtags);
					if (strpos($hashtags, "|")) {
						$hashtag_list = preg_split("/(?=[#@])/", $hashtags, -1, PREG_SPLIT_NO_EMPTY);
						$new_hashtag_list = array();
						foreach ($hashtag_list as $cur_hashtag) {
							#error_log("filter cur_hashtag: $cur_hashtag");
							if (strpos($cur_hashtag, "|")) {
								$cur_hashtag_list = explode("|", $cur_hashtag);
								$test_filters = str_getcsv($cur_hashtag_list[1], " ");
								for ($t = 0; $t < sizeof($test_filters); $t++) {
									#error_log("testing filter: " . trim($test_filters[$t]));
									if (trim($test_filters[$t]) == "") {
										continue;
									}
									if (stripos($title, trim($test_filters[$t])) !== false || stripos($description, trim($test_filters[$t])) !== false || stripos($content, trim($test_filters[$t])) !== false) {
										$new_hashtag_list[] = $cur_hashtag_list[0];
										#error_log("filter found: " . $cur_hashtag_list[0]);
										break;
									}
								}
							} else {
								$new_hashtag_list[] = $cur_hashtag;
							}
						}
						$hashtags = implode(" ", $new_hashtag_list);
					}
					add_post_meta($post_id, "mondoplayer_hashtags", $hashtags, true);
					$clean_hashtags = preg_replace('/[#@]/', '', $hashtags);
					$clean_hashtags = preg_replace('/\s+/', ',', $clean_hashtags);
					$clean_hashtags = preg_replace('/([a-z])([A-Z])/',"$1 $2", $clean_hashtags);
					wp_set_post_tags($post_id, $clean_hashtags, true);
				}
				if (get_option("ignore_original_tags", 0) == 0 && isset($readability->tags) && sizeof($readability->tags) > 0) {
					for ($i = 0; $i < sizeof($readability->tags); $i++) {
						if ($readability->tags[$i] != "") {
							if (in_array($readability->tags[$i], $exclude_tags)) {
								continue;
							}
							wp_set_post_tags($post_id, $readability->tags[$i], true);
						}
					}
				}

				if (sizeof($readability->contentVideos) > 0) {
					add_post_meta($post_id, "mondoplayer_embed_code",  $readability->contentVideos[0], true);
				}

				$images = new stdClass();
				$images->tries = 0;
				$images->post_status = $post_status;
				$images->featuredImages = $readability->featuredImages;
				$images->contentImages = $readability->contentImages;
				$images->contentVideos = $readability->contentVideos;
				$images->content = $readability->content;
				$images->cookies = $cookies;
				$images->requires_thumbnail = $requires_thumbnail;
				add_post_meta($post_id, "mondoplayer_images", wp_slash(json_encode($images)));
				#error_log("Images: " . json_encode($images));
				#$this->finish_post($post_id, $images);
			} else {
				error_log("Error creating post: $object_id");
				$this->send_posted_code($object_id, 7);
				$output .= "error creating post: $object_id " . json_encode($post_id);
			}
		}

		$this->finish_pending_posts();
		kses_init_filters();
		return $output;
	}

	function finish_post($post_id, $images) {
		#return;
		$image_list = array();
		$found_featured_image = false;
		$featured_image_url = "";
		$object_id = get_post_meta($post_id, 'mondoplayer_object_id', 0);
		if (get_post_meta($post_id, 'mondoplayer_finish', true)	== 1) {
			$this->send_posted_code($object_id, 8);
			$this->delete_post($post_id, 2);
			error_log("Cleaning up failed post $post_id");
		}

		if (is_array($images->featuredImages) && sizeof($images->featuredImages) > 0 ) {
			$upload_dir = wp_upload_dir();
			for ($i = 0; $i < sizeof($images->featuredImages); $i++ ) {
				error_log("Featured Image: $post_id " . $images->featuredImages[$i]);
				$image_data = $this->file_get_contents( $images->featuredImages[$i], $images->cookies );
				if (strlen($image_data) < $this->min_size) {
					error_log("image too small: $post_id " . strlen($image_data) );
					continue;
				}

				$filename = preg_replace('/[^a-zA-Z0-9]/', '', basename( parse_url($images->featuredImages[$i], PHP_URL_PATH)));
				$filename_prefix = "mp_$post_id" . "_$i" . "_";
				if ($filename == "") {
					$filename = uniqid();
				}
				if ( wp_mkdir_p( $upload_dir['path'] )) {
					$file = $upload_dir['path'] . "/$filename_prefix$filename";
				} else {
					$file = $upload_dir['basedir'] . "/$filename_prefix$filename";
				}
				file_put_contents( $file, $image_data );
				$image_type = exif_imagetype($file);
				if ($image_type === false) {
					error_log("Bad imagetype: $post_id");
					unlink($file);
					continue;
				}
				$wp_filetype = "image/jpeg";
				if ($image_type == IMAGETYPE_GIF) {
					$wp_filetype = "image/gif";
				} else if ($image_type == IMAGETYPE_PNG) {
					$wp_filetype = "image/png";
				}
				if ($image_type != IMAGETYPE_GIF && $image_type != IMAGETYPE_JPEG && $image_type != IMAGETYPE_PNG ) {
					add_post_meta($post_id, "mondoplayer_finish", 1, true);
					if (extension_loaded('imagick')) {
						error_log("Image conversion using imagick $file");
						$imagick = new Imagick();
						$imagick->readImage($file);
						$image_size = $imagick->getImageGeometry();
						$imagick->setImageFormat ("jpeg");
						$filehandle = fopen($file.".jpg", "wb");
						$imagick->writeImageFile($filehandle);
						fflush($filehandle);
						$imagick->clear();
						fclose($filehandle);
					} else if (extension_loaded('gmagick')) {
						error_log("Image conversion using gmagick $file");
						$gmagick = new Gmagick($file);
						$image_size = $gmagick->getsize();
						$gmagick->write($file . ".jpg");
						$gmagick->clear();
					} else if (extension_loaded('gd')) {
						error_log("Image conversion using gd $file");
						$temp_image = false;
						if ($image_type == IMAGETYPE_WEBP) {
							$temp_image = @imagecreatefromwebp($file);
						} else {
							$temp_image = @imagecreatefromstring(file_get_contents($file));
						}
						if ($temp_image === false) {
							error_log("Unsupported imagetype: $post_id " . $image_type);
							unlink($file);
							continue;
						}
						if (imagejpeg($temp_image, $file . ".jpg") == false) {
							error_log("Bad imagetype: $post_id " . $image_type);
							unlink($file);
							continue;
						}
					} else {
						error_log("PHP missing imagick, gmagick and gd: $post_id " . $image_type);
						unlink($file);
						continue;
					}
					unlink($file);
					$file .= ".jpg";
					$image_type = IMAGETYPE_JPEG;
					$wp_filetype = "image/jpeg";
				}

				$new_filename = "";
				if ($image_type == IMAGETYPE_GIF && ! preg_match('/\.gif$/i', $filename)) {
					$new_filename = $filename . ".gif";
				} else if ($image_type == IMAGETYPE_JPEG && ! preg_match('/\.jpg$/i', $filename) && ! preg_match('/\.jpeg$/i', $filename)) {
					$new_filename = $filename . ".jpg";
				} else if ($image_type == IMAGETYPE_PNG && ! preg_match('/\.png$/i', $filename)) {
					$new_filename = $filename . ".png";
				}
				if ($new_filename !== "") {
					$path = pathinfo($file);
					rename ($file, $path['dirname'] . "/$filename_prefix$new_filename");
					$file = $path['dirname'] . "/$filename_prefix$new_filename";
				}

				$attachment = array(
					'post_mime_type' => $wp_filetype,
					'post_title' => sanitize_file_name( $filename ),
					'post_content' => '',
					'post_status' => 'inherit',
					'post_parent' => $post_id,
				);

				#error_log("Attachment: " . print_r($attachment, true));

				$attach_id = wp_insert_attachment( $attachment, $file );
				require_once( ABSPATH . 'wp-admin/includes/image.php' );
				$attach_data = wp_generate_attachment_metadata( $attach_id, $file );
				#error_log("Attachment data: $attach_id, $file " . print_r($attach_data, true));
				wp_update_attachment_metadata( $attach_id, $attach_data );
				$alt = get_post_meta($attach_id, "_wp_attachment_image_alt" , true);
				if ($alt == "") {
					update_post_meta($attach_id,  "_wp_attachment_image_alt",  wp_kses_post(get_the_title($post_id)));
				}

				if (!isset($attach_data['width']) || $attach_data['width'] < 120 || $attach_data['height'] < 120) {
					error_log("Bad image size $post_id ");
					wp_delete_attachment( $attach_id, 'true');
					continue;
				}

				$test = set_post_thumbnail($post_id, $attach_id);
				if ($test) {
					$found_featured_image = true;
					$featured_image_url = wp_get_attachment_url($attach_id);
					$image_list[$images->featuredImages[$i]] = wp_get_attachment_url($attach_id);
					error_log("thumbnail set $post_id $attach_id");
					break;
				} else {
					error_log("Failure to set_post_thumbnail, skipping");
					wp_delete_attachment( $attach_id, 'true');
				}
			}
		}
		if ($images->requires_thumbnail == 1 && ! $found_featured_image) {
			error_log("Missing thumbnail $post_id " . $images->requires_thumbnail . " $found_featured_image");
			$this->send_posted_code($object_id, 9);
			$this->delete_post($post_id, 3);
		} else {
			if (sizeof($images->contentImages) > 0 ) {
				for ($i = 0; $i < sizeof($images->contentImages); $i++ ) {
					if (isset($image_list[$images->contentImages[$i]])) {
						continue;
					}
					$image_data = $this->file_get_contents( $images->contentImages[$i], $images->cookies );
					if (strlen($image_data) < $this->min_size) {
						error_log("image too small: $post_id " . strlen($image_data) );
						$image_list[$images->contentImages[$i]] = "";
						continue;
					}
					$filename_prefix = "mp_$post_id" . "_i_" . $i . "_";
					$filename = preg_replace('[^a-zA-Z0-9]', '', basename( parse_url($images->contentImages[$i], PHP_URL_PATH)));
					if ($filename == "") {
						$filename = uniqid();
					}
					if ( wp_mkdir_p( $upload_dir['path'] )) {
						$file = $upload_dir['path'] . "/$filename_prefix$filename";
					} else {
						$file = $upload_dir['basedir'] . "/$filename_prefix$filename";
					}
					file_put_contents( $file, $image_data );
					$image_type = exif_imagetype($file);
					if ($image_type === false) {
						error_log("Bad imagetype: $post_id");
						unlink($file);
						continue;
					}
					$wp_filetype = "image/jpeg";
					if ($image_type == IMAGETYPE_GIF) {
						$wp_filetype = "image/gif";
					} else if ($image_type == IMAGETYPE_PNG) {
						$wp_filetype = "image/png";
					}
					if ($image_type != IMAGETYPE_GIF && $image_type != IMAGETYPE_JPEG && $image_type != IMAGETYPE_PNG ) {
						add_post_meta($post_id, "mondoplayer_finish", 1, true);
						if (extension_loaded('imagick')) {
							error_log("Image conversion using imagick $file");
							$imagick = new Imagick();
							$imagick->readImage($file);
							$image_size = $imagick->getImageGeometry();
							$imagick->setImageFormat ("jpeg");
							$filehandle = fopen($file.".jpg", "wb");
							$imagick->writeImageFile($filehandle);
							fflush($filehandle);
							$imagick->clear();
							fclose($filehandle);
						} else if (extension_loaded('gmagick')) {
							error_log("Image conversion using gmagick $file");
							$gmagick = new Gmagick($file);
							$image_size = $gmagick->getsize();
							$gmagick->write($file . ".jpg");
							$gmagick->clear();
						} else if (extension_loaded('gd')) {
							error_log("Image conversion using gd $file");
							$temp_image = false;
							if ($image_type == IMAGETYPE_WEBP) {
								$temp_image = @imagecreatefromwebp($file);
							} else {
								$temp_image = @imagecreatefromstring(file_get_contents($file));
							}
							if ($temp_image === false) {
								error_log("Unsupported imagetype: $post_id " . $image_type);
								unlink($file);
								continue;
							}
							if (imagejpeg($temp_image, $file . ".jpg") == false) {
								error_log("Bad imagetype: $post_id " . $image_type);
								unlink($file);
								continue;
							}
						} else {
							error_log("PHP missing imagick, gmagick and gd: $post_id " . $image_type);
							unlink($file);
							continue;
						}
						unlink($file);
						$file .= ".jpg";
						$image_type = IMAGETYPE_JPEG;
						$wp_filetype = "image/jpeg";

					}
					$new_filename = "";
					if ($image_type == IMAGETYPE_GIF && ! preg_match('/\.gif$/i', $filename)) {
						$new_filename = $filename . ".gif";
					} else if ($image_type == IMAGETYPE_JPEG && ! preg_match('/\.jpg$/i', $filename) && ! preg_match('/\.jpeg$/i', $filename)) {
						$new_filename = $filename . ".jpg";
					} else if ($image_type == IMAGETYPE_PNG && ! preg_match('/\.png$/i', $filename)) {
						$new_filename = $filename . ".png";
					}
					if ($new_filename !== "") {
						$path = pathinfo($file);
						rename ($file, $path['dirname'] . "/$filename_prefix$new_filename");
						$file = $path['dirname'] . "/$filename_prefix$new_filename";
					}

					$attachment = array(
						'post_mime_type' => $wp_filetype,
						'post_title' => sanitize_file_name( $filename ),
						'post_content' => '',
						'post_status' => 'inherit'
					);

					$attach_id = wp_insert_attachment( $attachment, $file );
					require_once( ABSPATH . 'wp-admin/includes/image.php' );
					$attach_data = wp_generate_attachment_metadata( $attach_id, $file );
					wp_update_attachment_metadata( $attach_id, $attach_data );
					//set_post_thumbnail($post_id, $attach_id);
					$alt = get_post_meta($attach_id, "_wp_attachment_image_alt" , true);
					if ($alt == "") {
						update_post_meta($attach_id,  "_wp_attachment_image_alt",  wp_kses_post(get_the_title($post_id)));
					}

					$image_list[$images->contentImages[$i]] = wp_get_attachment_url($attach_id);
				}
			}

			foreach ($image_list as $key => $value) {
				error_log("image_list update: $post_id  $key - $value");
				if ($value == "" || $value == $featured_image_url) {
					$images->content = str_replace('src="' . $key .'"', 'src="" style="display:none"', $images->content);
				} else {
					$images->content = str_replace($key, $value, $images->content);
				}
			}

			$_POST['post_status'] = $images->post_status;
			$post_update = array(
				'ID' => $post_id,
				'post_status' => $images->post_status,
				'post_content' => $images->content,
			);
			wp_update_post($post_update);
			$this->send_posted_code($object_id, 1);
			delete_post_meta($post_id, "mondoplayer_images", "");
			update_post_meta($post_id, "wpzoom_is_featured", 1);
			if (isset($images->contentVideos[0]) && $images->contentVideos[0] != "") {
				set_post_format($post_id, "video");
				if (strpos($images->contentVideos[0], "onenewspage")) {
					update_post_meta($post_id, "_format_video_embed", '<iframe width="1080" height="620" style="border:0" src="' . $images->contentVideos[0] . '"></iframe>');
				} else {
					update_post_meta($post_id, "_format_video_embed", '<iframe width="640" height="360" style="border:0" src="' . $images->contentVideos[0] . '"></iframe>');
				}
			}

			$theme_check = wp_get_theme('videobox');
			if ($theme_check->exists()) {
				if (isset($images->contentVideos[0]) && $images->contentVideos[0] != "") {
					update_post_meta($post_id, "wpzoom_post_embed_code", '<iframe width="420" height="315" src="' . $images->contentVideos[0] . '"></iframe>');
					update_post_meta($post_id, "videobox_lightbox_popup_video_type", "iframe_embed");
				}
			}
			if (isset($GLOBALS['wpseo_video_xml'])) {
				try {
					error_log("Updating Yoast $post_id ");
					require_once(ABSPATH . 'wp-admin/includes/media.php');
					require_once(ABSPATH . 'wp-admin/includes/file.php');
					require_once(ABSPATH . 'wp-admin/includes/image.php');
					$GLOBALS['wpseo_video_xml']->update_video_post_meta($post_id);
				} catch (Exception $e) {
					error_log("Yoast error: $post_id  " . $e->get_message());
				}
			}
		}
	}

	function delete_post($post_id, $status) {
		error_log("Deleting post: $post_id");
		$license_key = get_option('mondoplayer_license_key');
		$object_id = get_post_meta($post_id, 'mondoplayer_object_id', 0);
		$autopilot_id = get_post_meta($post_id, 'mondoplayer_autopilot_id', 0);
		$params = array(
			'method'	=> 'POST',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
			'body'		=> array (
				'id'			=> $license_key,
				'delete_object'	=> $object_id,
				'autopilot_id'	=> $autopilot_id,
				'status'		=> $status,
				'server_id'		=> $this->server_id
			)
		);

		$response = wp_remote_post($this->autopilot_url, $params );
		$attachments = get_attached_media('', $post_id);
		foreach ($attachments as $attachment) {
			wp_delete_attachment( $attachment->ID, 'true' );
		}
		wp_delete_post($post_id, true);
	}

	function send_posted_code($object_id, $code) {
		$license_key = get_option('mondoplayer_license_key');
		$params = array(
			'method'	=> 'POST',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
			'body'		=> array (
				'id'			=> $license_key,
				'wp_post_code'	=> $code,
				'object_id'		=> $object_id,
				'server_id'		=> $this->server_id
			)
		);

		$response = wp_remote_post($this->autopilot_url, $params );
	}

	function file_get_contents($url, $cookies) {
		$params = array(
			'method'	=> 'GET',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=> $this->user_agent,
			),
			'cookies'  => $cookies
		);

		try {
			$response = wp_remote_get($url, $params );
			if ( is_wp_error( $response ) ) {
				$error_message = $response->get_error_message();
				error_log("Error fetching file $url: $error_message");
				return;
			}
			if ($response['response']['code'] == "403") {
				$params['header']['user-agent'] = $this->backup_user_agent;
				$response = wp_remote_get($url, $params );
				if ( is_wp_error( $response ) ) {
					$error_message = $response->get_error_message();
					error_log("Error fetching file $url: $error_message");
					return;
				}
			}
			#error_log("result: " . wp_remote_retrieve_body($response));
			return  wp_remote_retrieve_body($response);
		} catch (Exception $e) {
			error_log("ERROR with wp_remote_get: $url  " . $e->get_message());
		}
	}
}
