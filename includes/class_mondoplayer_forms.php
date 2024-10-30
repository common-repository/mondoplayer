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

class MondoPlayer_Forms {
	public $license_key;
	public $screen_name;
	public $parent;
	public $autopilot_url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";
	public $mastermind_api_key = "P80c21Kq7xFuATK5ux2wgS60BV4kxdEYcgWxEnn5JGIh7v64qExYAHo9SQv1";
	public $mastermind_api_url = "http://vlog.mondoplayer.com/wp-content/themes/twentytwenty-child/handler.php";
	function __construct($parent) {
		$this->license_key = get_option( 'mondoplayer_license_key' );
		$this->screen_name = get_option( 'mondoplayer_screen_name' );
		$this->parent = $parent;
	}

	function process_form() {
		global $wpdb;
		if (! isset($_POST['form'])) {
			return;
		}
		$retval = '';
		if ($_POST['form'] == "create_post") {
			$retval = $this->create_post();
		} else if ($_POST['form'] == "create_category") {
			$retval = $this->create_category();
		} else if ($_POST['form'] == "delete_category") {
			$retval = $this->delete_category();
		} else if ($_POST['form'] == "registration") {
			$retval = $this->registration();
		} else if ($_POST['form'] == "options") {
			$retval = $this->options();
		} else if ($_POST['form'] == "trusted_domains") {
			$retval = $this->trusted_domains();
		} else if ($_POST['form'] == "show_notification") {
			update_option("mondoplayer_show_notification", $_POST['count']);
		} else if ($_POST['form'] == "category_urls") {
			$retval = $this->category_urls(intval($_POST['category_id']));
		} else if ($_POST['form'] == "save_category") {
			$this->save_category();
		} else if ($_POST['form'] == "bulk_action") {
			$this->bulk_action();
		} else if ($_POST['form'] == "get_autopilot_report") {
			$this->autopilot_report();
		} else if ($_POST['form'] == "parse_youtube") {
			$retval = $this->parse_youtube($_POST['youtube_url']);
		} else if ($_POST['form'] == "mastermind_redirect") {
			$retval = $this->parent->mastermind_redirect($_POST['mastermind_redirect']);
		} else if ($_POST['form'] == "duplicate_post") {
			$retval = $this->duplicate_post();
		} else if ($_POST['form'] == "go_to_mastermind") {
			$retval = $this->go_to_mastermind($_POST['return_url']);
		}

		header("Content-Type: application/json");
		echo json_encode($retval);

		$theme_check = wp_get_theme();
		if ($theme_check->name == "MondoPlayer Theme") {
			$wpdb->query("DELETE FROM " . $wpdb->prefix . "mondoplayer_slider_cache", ARRAY_N);
		}
		exit;
	}

	function parse_youtube($youtube_url) {
		$params = array(
			'method'	=> 'GET',
			'timeout'	=> 40,
			'blocking'	=> true,
			'header'	=> array (
				'user-agent'	=>  "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36",
			),
		);

		$response = wp_remote_get($youtube_url, $params );

		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error getting Youtube html: $error_message");

			$retval = array(
				'success' => 1,
				'errorMessage' => $error_message
			);
			return $retval;
		}
		if ($response['response']['code'] == "429") {
			error_log("Error getting Youtube html: 429 - " . $response['headers']['Retry-After']);

			$retval = array(
				'success' => 1,
				'errorMessage' => "HTTP error 429"
			);
			return $retval;
		} else if ($response['response']['code'] != "200") {
			error_log("Error getting Youtube html: " . $response['response']['code']);

			$retval = array(
				'success' => 1,
				'errorMessage' => "HTTP error " . $response['response']['code']
			);
			return $retval;
		}

    	$xml = new DOMDocument();
		$xml->loadHTML(wp_remote_retrieve_body($response));
		$channel_id = "";
		foreach ($xml->getElementsByTagName('meta') as $meta) {
			if ($meta->hasAttribute('itemprop') && $meta->getAttribute('itemprop') == 'channelId') {
				$channel_id = $meta->getAttribute('content');
				break;
			}
		}

		$retval = array(
			'success' => 0,
			'channel_id' => $channel_id,
		);

		return $retval;
	}

	function create_post() {
		global $wpdb;
		require_once(plugin_dir_path(__FILE__) . 'class_mondoplayer_post.php');
		$mondoplayer_post = new MondoPlayer_Post();
		$cur_post = json_decode(stripslashes($_POST['create_post']));
		#error_log("create_post: " . $_POST['create_post']);

		$thumbnail = 0;
		if ($cur_post->thumbnail) {
			$thumbnail = 1;
		}
		$hashtags_string = "";
		if ($cur_post->hashtags != "") {
			$hashtags_string = preg_replace('/[#@]/', '', trim($cur_post->hashtags));
			$hashtags_string = preg_replace('/\s+/', ' #', $hashtags_string);
			if ($hashtags_string != "") {
				$hashtags_string = "#" . $hashtags_string;
			}
		}

		$get_object_message = $mondoplayer_post->get_object(intval($cur_post->id), sanitize_text_field($cur_post->url), $cur_post->categories, sanitize_text_field($cur_post->title), sanitize_text_field($cur_post->status), 0, sanitize_text_field($cur_post->search_terms), $thumbnail, intval($cur_post->user), $hashtags_string, "", sanitize_text_field($cur_post->thumbnail_url), sanitize_text_field($cur_post->embedVideo));
		$retval = array( 
			'message' => $get_object_message,
		);
		return $retval;
	}
	function create_category() {
		$args = array(
			'cat_name' => sanitize_text_field($_POST['create_category']),
			'category_description' => '',
			'category_nicename' => '',
			'category_parent' => '',
			'taxonomy' => 'category'
			);
		$term_id = wp_insert_category($args);

		if ($term_id > 0) {
			$hide = 0;
			if ($_POST['create_category_hide']) {
				$hide = 1;
			}
			update_term_meta($term_id, "mondoplayer_hide", $hide );
			update_term_meta($term_id, "mondoplayer_pending", 1 );
			update_term_meta($term_id, "mondoplayer_post_content", 0 );
			update_term_meta($term_id, "mondoplayer_add_links", 1 );
			update_term_meta($term_id, "mondoplayer_read_more", 1 );
			update_term_meta($term_id, "mondoplayer_read_more_color", "#000" );
			update_term_meta($term_id, "mondoplayer_video_thumbnail", 1 );
			update_term_meta($term_id, "mondoplayer_video_above", 1 );
			update_term_meta($term_id, "mondoplayer_prepend", "[]" );
			update_term_meta($term_id, "mondoplayer_append", "[]" );
			update_term_meta($term_id, "mondoplayer_prepend_index", 0 );
			update_term_meta($term_id, "mondoplayer_append_index", 0 );
		}

		$categories = get_categories( array(
			'orderby' => 'name',
			'order' => 'asc',
			'hide_empty' => false,
		));

		$category_output = array();
		#$category_string = "[";
		foreach ( $categories as $category ) {
			$category_hide = get_term_meta($category->term_id, "mondoplayer_hide", 1 );
			$category_pending = get_term_meta($category->term_id, "mondoplayer_pending", 1 );
			$category_output[] = array(
				'name' => $category->name,
				'term_id' => $category->term_id,
				'pending' => $category_pending,
				'hide' => $category_hide,
			);
		}

		$retval = array(
			'categories' => $category_output,
		);

		return $retval;
	}

	function delete_category() {
		wp_delete_category(intval($_POST['delete_category']));
		$categories = get_categories( array(
			'orderby' => 'name',
			'order' => 'asc',
			'hide_empty' => false,
		));

		$category_output = array();
		#$category_string = "[";
		foreach ( $categories as $category ) {
			$category_output[] = array(
				'name' => $category->name,
				'term_id' => $category->term_id,
			);
		}

		$retval = array(
			'categories' => $category_output,
		);

		return $retval;
	}


	function save_category() {
		$args = array(
			'cat_ID' => intval($_POST['new_category_id']),
			'cat_name' => sanitize_text_field($_POST['tag-name']),
			'category_description' => sanitize_text_field($_POST['tag-description']),
			'category_nicename' => sanitize_text_field($_POST['slug']),
			'category_parent' => intval($_POST['tag-parent']),
			'taxonomy' => 'category'
		);
		$category_id = wp_insert_category($args);

		wp_safe_redirect("admin.php?page=mondoplayer_menu_categories_slug", 302 );
		exit;
	}

	function registration() {
		#error_log("New registration: " . $_POST['mondoplayer_license_key'] );
		add_option('mondoplayer_license_key', preg_replace("/[^A-Za-z0-9 ]/", '', sanitize_text_field($_POST['mondoplayer_license_key'])));
		$mondoplayer_is_subscribed = 0;
		if ($_POST['mondoplayer_is_subscribed'] == 1) {
			$mondoplayer_is_subscribed = 1;
		}
		update_option('mondoplayer_is_subscribed', $mondoplayer_is_subscribed);
		$mondoplayer_is_trial = 0;
		if ($_POST['mondoplayer_is_trial'] == 1) {
			$mondoplayer_is_trial = 1;
		}
		update_option('mondoplayer_is_trial', $mondoplayer_is_trial);
		$mondoplayer_is_mastermind = 0;
		if ($_POST['mondoplayer_is_mastermind'] == 1) {
			$mondoplayer_is_mastermind = 1;
		}
		update_option('mondoplayer_is_mastermind', $mondoplayer_is_mastermind);
		update_option('mondoplayer_screen_name', wp_filter_nohtml_kses($_POST['mondoplayer_screen_name']));
		update_option('mondoplayer_userid', wp_filter_nohtml_kses($_POST['mondoplayer_userid']));

		$retval = array(
			'registration' => true,
		);

		return $retval;
	}
	function trusted_domains() {
		update_option('mondoplayer_trusted_domains',$_POST['mondoplayer_trusted_domains']);
		$retval = array(
			'trusted_domains' => true,
		);

		return $retval;
	}

	function options() {
		$tags = wp_kses_allowed_html('post');
		$tags['iframe'] = array(
			'src' => true,
			'height' => true,
			'width' => true,
			'frameborder' => true,
			'allowfullscreen' => true,
			'allow' => true,
			'style' => true,
		);
		$theme_check = wp_get_theme();

		if ($theme_check->name != "MondoPlayer Theme") {
			$prepends = json_decode(stripslashes($_POST['mondoplayer_prepend']));
			for ($i = 0; $i < sizeof($prepends); $i++) {
				$prepends[$i] = wp_kses($prepends[$i], $tags, '');
			}
			$appends = json_decode(stripslashes($_POST['mondoplayer_append']));
			for ($i = 0; $i < sizeof($appends); $i++) {
				$appends[$i] = wp_kses($appends[$i], $tags, '');
			}

			update_option('mondoplayer_prepend_index', 0);
			update_option('mondoplayer_prepend', json_encode($prepends));
			update_option('mondoplayer_append_index', 0);
			update_option('mondoplayer_append', json_encode($appends));
		}
		update_option('mondoplayer_max_words', intval($_POST['mondoplayer_max_words']));
		if (isset($_POST['ignore_original_tags'])) {
			update_option('ignore_original_tags', intval($_POST['ignore_original_tags']));
		}
		update_option('mondoplayer_delete_age',intval($_POST['mondoplayer_delete_age']));

		if (isset($_POST['mondoplayer_rss_message'])) {
			error_log("Updating: " . $_POST['mondoplayer_rss_message']);
			update_option('mondoplayer_rss_message', $_POST['mondoplayer_rss_message']);
		}

		if (isset($_POST['mondoplayer_trusted_domains'])) {
			update_option('mondoplayer_trusted_domains',$_POST['mondoplayer_trusted_domains']);
		}
		if (isset($_POST['excluded_meta_tags'])) {
			update_option('mondoplayer_exclude_meta_tags',$_POST['excluded_meta_tags']);
		}
		$retval = array(
			'options' => true,
		);

		return $retval;
	}

	function category_urls($category_id) {
		$retval = array(
			'category_url' => get_category_link($category_id),
			'feed_url' => get_category_feed_link($category_id, 'rss2'),
		);

		return $retval;
	}

	function bulk_action() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mondoplayer_deleted_posts';

		$post_ids = json_decode(sanitize_text_field($_POST["posts"]));
		for ($i = 0; $i < sizeof($post_ids); $i++) {
			$post_id = intval($post_ids[$i]);
			#error_log("processing post $post_ids[$i] for " . $_POST["bulk_action"]);
			$post = get_post($post_id);
			$post_meta = get_post_meta($post_id, '', true);
			#if ($post_meta['mondoplayer_object'][0] == 1) {
				if ($_POST["bulk_action"] == "trash") {
					$object_id = get_post_meta($post_id, 'mondoplayer_object_id', true);
					$autopilot_id = get_post_meta($post_id, 'mondoplayer_autopilot_id', true);
					$params = array(
						'method'	=> 'POST',
						'timeout'	=> 40,
						'blocking'	=> true,
						//'header'	=> array (
						//	'user-agent'	=> $this->user_agent,
						//),
						'body'		=> array (
							'id'			=> $this->license_key,
							'delete_object'	=> $object_id,
							'autopilot_id'	=> $autopilot_id,
							'status'		=> 0
						)
					);

					$response = wp_remote_post($this->autopilot_url, $params );
					$attachments = get_attached_media('', $post_id);
					foreach ($attachments as $attachment) {
						wp_delete_attachment( $attachment->ID, 'true' );
					}
					$redirect_url = "/";
					$post_categories = wp_get_post_categories($post_id);
					if ($post_categories) {
						$redirect_url = get_category_link($post_categories[0]);
					}
					if ($post->post_name != "") {
						$wpdb->insert($table_name, array('url' => $post->post_name, 'category' => $redirect_url));
					}
					wp_delete_post($post_id, true);
				} else if ($_POST["bulk_action"] == "publish") {
					$post_update = array(
						'ID' => $post_id,
						'post_status' => "publish",
					);
					wp_update_post($post_update);
				} else if ($_POST["bulk_action"] == "draft") {
					$post_update = array(
						'ID' => $post_id,
						'post_status' => "draft",
					);
					wp_update_post($post_update);
				}
			#}
		}
		return;
	}
	function duplicate_post() {
		$post_id = intval($_POST["post_id"]);
		error_log("duplicate_post: " . $post_id);
		if ($post_id == 0) {
			return;
		}

		$cur_post = get_post($post_id);
		if ($cur_post === false) {
			return;
		}
		$new_post = array(
			'post_author' => $cur_post->post_author,
			'post_content' => $cur_post->post_content,
			'post_content_filtered' => $cur_post->post_content_filtered,
			'post_title' => $cur_post->post_title,
			'post_excerpt' => $cur_post->post_excerpt,
			'post_type' => $cur_post->post_type,
			'post_category' => array(),
			'meta_input' => array(),
		);
		$cur_categories = wp_get_post_categories($post_id);
		foreach($cur_categories as $category) {
			$new_post['post_category'][] = $category->term_id;
		}
		$cur_meta = get_post_meta($post_id);
		$cur_keys = array_keys($cur_meta);
		foreach($cur_keys as $key) {
			$new_post['meta_input'][$key] = $cur_meta[$key][0];
		}
		$result = wp_insert_post($new_post, true);
		return;
	}

	function autopilot_report() {
		global $wpdb;
		$params = array(
			'method'	=> 'GET',
			'timeout'	=> 40,
			'blocking'	=> true,
		);

		$report = array();

		$response = wp_remote_post($this->autopilot_url . "?id=" . $this->license_key . "&get_autopilot_report=" . intval($_POST['autopilot_id']), $params );
		$report['original'] = json_decode(wp_remote_retrieve_body($response));
		$min_date = date('Y-m-d', strtotime("-30 days"));
		$posts_array = array(
			'post_type' => 'post',
			'post_status' => array('publish', 'pending', 'draft', 'auto-draft', 'future', 'private', 'inherit', 'trash'),
			'numberposts' => -1,
			'date_query' => array(
				'after' => $min_date,
			),
			'meta_query' => array(
				array(
					'key' => 'mondoplayer_autopilot_id',
					'value' => intval($_POST['autopilot_id']),
					'compare' => "=",
				),
			),
		);
		$report['posts'] = array();
		$post_query = get_posts($posts_array);

		for ($i = 0; $i < count($post_query); $i++) {
			$mondoplayer_origional_url = get_post_meta($post_query[$i]->ID, 'mondoplayer_origional_url', false);
			$mondoplayer_search_term = get_post_meta($post_query[$i]->ID, 'mondoplayer_search_terms', false);

			$report['posts'][] = array (
				'ID'			=> $post_query[$i]->ID,
				'original_url'	=> $mondoplayer_origional_url,
				'search_term'	=> $mondoplayer_search_term,
				'url'			=> get_permalink($post_query[$i]->ID),
				'title'			=> get_the_title($post_query[$i]->ID),
				'date'			=> get_the_date('c', $post_query[$i]->ID),
				'slug'			=> $post_query[$i]->name,
			);
		}
		if ( $wpdb->get_var( "SHOW TABLES LIKE 'wp_mondoplayer_ad_stats'" ) === 'wp_mondoplayer_ad_stats' ) {
			$report['views'] = $wpdb->get_results("SELECT COUNT(*) as total, wp_posts.ID as ID, wp_posts.post_title, wp_mondoplayer_ad_stats.autopilot_id as autopilot_id, (SELECT meta_value FROM wp_postmeta WHERE post_id = wp_posts.ID AND meta_key = 'mondoplayer_search_terms' ) as search_terms, DAYOFYEAR(wp_mondoplayer_ad_stats.add_date) as day FROM wp_mondoplayer_ad_stats, wp_posts, wp_postmeta WHERE wp_mondoplayer_ad_stats.add_date > DATE_SUB(CURDATE(), INTERVAL 90 DAY) AND wp_posts.ID = wp_mondoplayer_ad_stats.post_id AND wp_posts.ID = wp_postmeta.post_id AND wp_postmeta.meta_key = 'mondoplayer_autopilot_id' AND wp_postmeta.meta_value = " . intval($_POST['autopilot_id']) . " AND wp_mondoplayer_ad_stats.post_id <> 0 GROUP BY wp_posts.ID, wp_postmeta.meta_value, day", OBJECT);
		} else {
		$report['views'] = $wpdb->get_results("SELECT COUNT(*) as total, wp_posts.ID as ID, wp_posts.post_title, wp_postmeta.meta_value as autopilot_id, (SELECT meta_value FROM wp_postmeta WHERE post_id = wp_posts.ID AND meta_key = 'mondoplayer_search_terms' ) as search_terms, DAYOFYEAR(wp_statify.created) as day FROM wp_statify, wp_posts, wp_postmeta WHERE wp_statify.created > DATE_SUB(NOW(), INTERVAL 90 DAY) AND wp_posts.post_name = REPLACE(SUBSTRING_INDEX(wp_statify.target, '/', 2), '/', '') AND wp_posts.ID = wp_postmeta.post_id AND wp_postmeta.meta_key = 'mondoplayer_autopilot_id' AND wp_postmeta.meta_value = " . intval($_POST['autopilot_id']) . " AND wp_statify.target <> '/' GROUP BY wp_posts.ID, wp_statify.target, wp_postmeta.meta_value, day", OBJECT);
		}

		header("Content-Type: application/json");
		echo json_encode($report);
		exit;
	}
	function go_to_mastermind($return_url) {
		error_log("go_to_mastermind: " . $return_url);
		$retval = array('error' => false, 'error_message' => "");
		$result = wp_remote_get($this->mastermind_api_url . "?mastermind_api=" . $this->mastermind_api_key . "&return_url=$return_url");

		if (is_wp_error($result)) {
			error_log("ERROR: " . $result->get_error_message());
		}
		$retval['data'] = json_decode($result['body']);

		return $retval;
	}
}
