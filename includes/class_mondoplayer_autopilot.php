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

class MondoPlayer_Autopilot {
	public $autopilot_url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";
	public $table_name;
	public $license_key;
	public $is_subscribed;
	public $is_trial;
	public $screen_name;
	public $autopilot_string;
	public $autopilots;
	public $server_id;
	function __construct() {
		global $wpdb;
		$this->license_key = get_option( 'mondoplayer_license_key' );
		$this->is_subscribed = get_option( 'mondoplayer_is_subscribed' );
		$this->is_trial = get_option( 'mondoplayer_is_trial' );
		$this->screen_name = get_option( 'screen_name' );
		$this->table_name = $wpdb->prefix . "mondoplayer_autopilot";
		$this->autopilot_string =  get_option( 'mondoplayer_autopilot_string', "[]" );
		$this->server_id = gethostname();
		ini_set('max_execution_time', 300);
	}

	function new_autopilot() {
		global $wpdb;
		$new_autopilots = get_option("mondoplayer_new_autopilots", array());
		$results = $wpdb->get_results("SELECT autopilot_id, search_terms from $this->table_name");
		foreach ($results as $autopilot) {
			if (in_array($autopilot->autopilot_id, $new_autopilots)) {
				continue;
			}
			$searches = explode("|", $autopilot->search_terms);
			$object_count = count($searches) * 2;
			if ($object_count < 3) {
				$object_count = 3;
			}
			for ($i = 0; $i < $object_count; $i++) {
				$this->get_object($autopilot->autopilot_id);
			}
			array_push($new_autopilots, $autopilot->autopilot_id);
		}
		update_option("mondoplayer_new_autopilots", $new_autopilots);
	}

	function sync_autopilots() {
		global $wpdb;
		if ($this->license_key == "") {
			return;
		}

		set_time_limit(120);
		if (isset($_GET['saved']) || get_option("mondoplayer_autopilot_sync", 0) + 21600 < time() || $this->autopilot_string == "[]") {
			update_option("mondoplayer_autopilot_sync", time());
			error_log("syncing autopilots");
			$limit = -1;
			if ($this->is_subscribed == 0) {
				$limit = 1;
				$comparison = "=";
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
					$limit = 0;
				}
			}

			$categories = get_categories( array(
				'orderby' => 'name',
				'order' => 'asc',
				'hide_empty' => false,
			));
			$category_list = array();
			foreach ( $categories as $category ) {
				$cur_category = array('name' => $category->name, 'term_id' => $category->term_id, 'slug' => $category->term_id);
				array_push($category_list, $cur_category);
			}

			$users = get_users( array(
				'orderby' => 'nicename',
				'order' => 'asc',
				'hide_empty' => false,
				'role__in' => ['Contributor','Author','Editor','Administrator'],
			));
			$user_list = array();
			foreach ( $users as $user ) {
				$cur_user = array('name' => $user->display_name, 'user_id' => $user->ID);
				array_push($user_list, $cur_user);
			}

			$params = array(
				'method'	=> 'POST',
				'timeout'	=> 40,
				'blocking'	=> true,
				//'sslcertificates' => plugin_dir_path(__FILE__) . "../ca_bundle.crt",
				//'sslverify'	=> false,
				'body'		=> array (
					'id'			=> $this->license_key,
					'get_autopilot'	=> 1,
					'get_update'	=> 1,
					'categories'	=> json_encode($category_list),
					'users'			=> json_encode($user_list),
					'limit'			=> $limit,
					'server_id'		=> $this->server_id,
				)
			);

			$response = wp_remote_post($this->autopilot_url, $params );
			if ( is_wp_error( $response ) ) {
				$error_message = $response->get_error_message();
				error_log("Error syncing autopilots: $error_message");
				return;
			}

			$this->autopilot_string = wp_remote_retrieve_body($response);
			update_option("mondoplayer_autopilot_string", $this->autopilot_string);
		}

		$this->autopilots = json_decode($this->autopilot_string);
		if (property_exists($this->autopilots, "posts") && sizeof($this->autopilots->posts) > 0) {
			require_once(plugin_dir_path(__FILE__).'class_mondoplayer_post.php');
			$mondoplayer_post = new MondoPlayer_Post();
			for ($i = 0; $i < sizeof($this->autopilots->posts); $i++) {
				error_log("cur_post: " . $this->autopilots->posts[$i]->posts);
				$cur_post = json_decode($this->autopilots->posts[$i]->posts);
				$status = "publish";
				if ($cur_post->status_id == 0) {
					$status = "draft";
				}
				$get_object_message = $mondoplayer_post->get_object($cur_post->media_id, $cur_post->url, $cur_post->term_ids, $cur_post->message, $status, 0, $cur_post->search_terms, null, $cur_post->user_id, "", "", "" );
			}
		}

		$wpdb->query("DELETE FROM $this->table_name");
		$wpdb->query("DELETE FROM " . $this->table_name . "_schedule");

		for ($i = 0; $i < sizeof($this->autopilots->autopilots); $i++) {
			$cur_autopilot = $this->autopilots->autopilots[$i];
			if ($cur_autopilot->service == 15) {
				error_log("Autopilot user: " . $cur_autopilot->user);
				if ($cur_autopilot->user == -2) {
					$curator = get_user_by('login', 'curator');
					if ($curator) {
						$cur_autopilot->user = $curator->ID;
					} else {
						$curator = wp_insert_user(
							array(
								'user_login' => 'curator',
								'user_nicename' => 'curator',
								'user_pass' => '',
								'display_name' => 'Curator',
								'role' => 'contributor'
							)
						);
						if (is_wp_error($curator)) {
							error_log("Error creating curator: " . json_encode($curator));
							$cur_autopilot->user = 0;
						} else {
							$cur_autopilot->user = $curator;
						}
					}
				}
				$wpdb->query(
					$wpdb->prepare("INSERT INTO $this->table_name (autopilot_id, title, search_terms, search_terms_date, search_term_index, feed_video_only, schedules, categories, user, hashtags) VALUES (%d, '%s', '%s', '%s',%d, %d, '%s', '%s', %d, '%s') ON DUPLICATE KEY UPDATE title='%s', search_terms='%s', search_terms_date='%s', search_term_index=%d, feed_video_only=%d, schedules='%s', categories='%s', user='%d', hashtags='%s'", $cur_autopilot->autopilot_id, $cur_autopilot->title, $cur_autopilot->search_terms, $cur_autopilot->search_terms_date,$cur_autopilot->search_term_index, $cur_autopilot->feed_video_only, json_encode($cur_autopilot->schedule), $cur_autopilot->categories, $cur_autopilot->user, $cur_autopilot->hashtags_string, $cur_autopilot->title, $cur_autopilot->search_terms, $cur_autopilot->search_terms_date,$cur_autopilot->search_term_index, $cur_autopilot->feed_video_only, json_encode($cur_autopilot->schedule), json_encode($cur_autopilot->categories), $cur_autopilot->user, $cur_autopilot->hashtags_string ));

				for ($s = 0; $s < count($cur_autopilot->schedule); $s++) {
					$wpdb->query(
						$wpdb->prepare("INSERT INTO " . $this->table_name . "_schedule (autopilot_id, day, hour) VALUES (%d, %d, %d)", $cur_autopilot->autopilot_id, $cur_autopilot->schedule[$s]->day, $cur_autopilot->schedule[$s]->hour )
					);
				}
			}
		}
		wp_schedule_single_event(time(), 'mondoplayer_new_autopilot');
	}

	function run_autopilots() {
		global $wpdb;
		$date = current_time('N G', false);
		list($wday, $hour) = explode(' ', $date);
		if ($wday > 6) {
			$wday = 0;
		}
		#error_log("cron: $date, $wday, $hour");
		$this->sync_autopilots();

		$results = $wpdb->get_results($wpdb->prepare("SELECT autopilot_id from " . $this->table_name . "_schedule WHERE day = %d AND hour = %d", $wday, $hour ));
		shuffle($results);

		for ($i = 0; $i < count($results); $i++) {
			set_time_limit(120);
			$this->get_object($results[$i]->autopilot_id);
		}
	}

	function get_object($autopilot_id) {
		global $wpdb;
		if ($this->is_subscribed == 0) {
			$min_date = date('Y-m-d', strtotime("-7 days"));
			$posts_array = array(
				'date_query' => array(
					'after' => $min_date,
				),
				'meta_query' => array(
					array(
						'key' => 'mondoplayer_autopilot_id',
						'value' => 0,
						'compare' => '>'
					),
				)
			);

			$post_query = new WP_Query($posts_array);
			if ($post_query->found_posts > 0) {
				error_log("Skipping get_object - trial");
				return;
			}
		}
		require_once(plugin_dir_path(__FILE__).'class_mondoplayer_post.php');
		$mondoplayer_post = new MondoPlayer_Post();
		$autopilot = $wpdb->get_results($wpdb->prepare("SELECT * from $this->table_name WHERE autopilot_id = %d", $autopilot_id ));

		if (sizeof($autopilot) == 0) {
			return "Error: AutoPilot $autopilot_id not found";
		}

		$results = $wpdb->get_var("SELECT wp_posts.ID FROM wp_posts, wp_postmeta WHERE wp_posts.ID = wp_postmeta.post_id AND wp_posts.post_type = 'post' AND wp_postmeta.meta_key = 'mondoplayer_autopilot_id' AND wp_postmeta.meta_value = $autopilot_id ORDER BY wp_posts.post_date DESC LIMIT 1");
		$search_index = 0;
		$last_search = "";
		if ($results && $results > 0) {
			$last_search = $wpdb->get_var("SELECT meta_value FROM wp_postmeta WHERE meta_key = 'mondoplayer_search_terms' AND post_id = $results");
		}

		$searches = explode("|", $autopilot[0]->search_terms);
		$hashtags = "";
		for ($i = 0; $i < sizeof($searches); $i++) {
			$search = $searches[$i];
			error_log("search: " . $search . " - " . $last_search);
			#if ($search == $last_search) {
			#	continue;
			#}
			if (preg_match("/youtube/", $search)) {
				continue;
			}
			if (preg_match("/\w\w\.\w\w/", $search)) {
				preg_match_all('/"(?:\\\\.|[^\\\\"])*"|\S+/', $search, $search_split);
				$search_term_array = array();
				$domain = "";
				foreach ($search_split[0] as $term) {
					if (preg_match("/\w\w\.\w\w/", $term)) {
						$domain = $term;
					} else {
						$search_term_array[] = $term;
					}
				}
				error_log("check search: $domain - " . implode(" ", $search_term_array));
				$search_url = $mondoplayer_post->check_special_domain($domain, implode(" ", $search_term_array));
				if ($search_url != "") {
					$urls =  $mondoplayer_post->special_domain_search($search_url);
					if (is_array($urls)) {
						foreach ($urls as $url) {
							$url_test = $wpdb->get_var("SELECT post_id FROM wp_postmeta WHERE meta_key = 'mondoplayer_origional_url' AND meta_key = '$url'");
							if ($url_test) {
								continue;
							}
							$hashtags = json_decode($autopilot[0]->hashtags);
							$hashtags_string = "";
							if ($hashtags) {
								if (sizeof($hashtags->fixed) > 0) {
									$hashtags_string .= implode(" ", $hashtags->fixed);
								}
								if (sizeof($hashtags->variable) > 0) {
									$variable = array();
									for ($v = 0; $v < $hashtags->variable_count; $v++) {
										$test = $hashtags->variable[rand(0, sizeof($hashtags->variable))];
										if (!in_array($test, $variable)) {
											$variable[] = $hashtags->variable[rand(0, sizeof($hashtags->variable))];
										}
									}
									$hashtags_string .= " " . implode(" ", $variable);
								}
								if ($hashtags->search[$i]) {
									if (sizeof($hashtags->search[$i]->fixed) > 0) {
										$hashtags_string .= " " . implode(" ", $hashtags->search[$i]->fixed);
									}
									if (sizeof($hashtags->search[$i]->variable) > 0) {
										$variable = array();
										for ($v = 0; $v < $hashtags->search[$i]->variable_count; $v++) {
											$test = $hashtags->search[$i]->variable[rand(0, sizeof($hashtags->search[$i]->variable))];
											if (!in_array($test, $variable)) {
												$variable[] = $test;
											}
										}
										$hashtags_string .= " " . implode(" ", $variable);
									}
								}
							}
							$cur_categories = json_decode($autopilot[0]->categories);
							$get_object_message = $mondoplayer_post->get_object(0, $url, $cur_categories, '', '', $autopilot_id, $search, $autopilot[0]->feed_video_only, $autopilot[0]->user, $hashtags_string,'' );
							if (substr($get_object_message, 0, 7) == "Created") {
								return $get_object_message;
							}
						}
					}
				}
			}
		}

		$test = true;
		$tries = 5;
		$get_object_message = "";
		while ($test) {
			$autopilot_object = $mondoplayer_post->get_autopilot_object($this->license_key, $autopilot_id );
			if ($autopilot_object == null) {
				error_log("No content returned for $autopilot_id");
				break;
			}
			$cur_categories = json_decode($autopilot[0]->categories);

			$url_test = parse_url($autopilot_object->url, PHP_URL_HOST);
			if ($url_test == parse_url(get_site_url())) {
				$tries--;
				continue;
			}

			$get_object_message = $mondoplayer_post->get_object($autopilot_object->id, $autopilot_object->url, $cur_categories, $autopilot_object->title, '', $autopilot_id, $autopilot_object->search_terms, $autopilot[0]->feed_video_only, $autopilot[0]->user, $autopilot_object->hashtags, $autopilot_object->description );
			if (substr($get_object_message, 0, 7) == "Created") {
				$test = false;
			} else {
				$tries--;
			}
			if ($tries <= 0) {
				$test = false;
			}
		}
		if (substr($get_object_message, 0, 7) == "Created") {
			return $get_object_message;
		}

		for ($i = 0; $i < sizeof($searches); $i++) {
			$search = $searches[$i];
			#if ($search == $last_search) {
			#	continue;
			#}
			if (preg_match("/youtube/", $search)) {
				continue;
			}
			if (preg_match("/\w\w\.\w\w/", $search)) {
				continue;
			}

			$search_url = "https://www.youtube.com/results?search_query=" . urlencode($search) . "&sp=EgIIAw%253D%253D";
			if ($search_url != "") {
				$urls =  $mondoplayer_post->special_domain_search($search_url);
				if (is_array($urls)) {
					foreach ($urls as $url) {
						$url_test = $wpdb->get_var("SELECT post_id FROM wp_postmeta WHERE meta_key = 'mondoplayer_origional_url' AND meta_key = '$url'");
						if ($url_test) {
							continue;
						}
						$hashtags = json_decode($autopilot[0]->hashtags);
						$hashtags_string = "";
						if ($hashtags) {
							if (sizeof($hashtags->fixed) > 0) {
								$hashtags_string .= implode(" ", $hashtags->fixed);
							}
							if (sizeof($hashtags->variable) > 0) {
								$variable = array();
								for ($v = 0; $v < $hashtags->variable_count; $v++) {
									$test = $hashtags->variable[rand(0, sizeof($hashtags->variable))];
									if (!in_array($test, $variable)) {
										$variable[] = $hashtags->variable[rand(0, sizeof($hashtags->variable))];
									}
								}
								$hashtags_string .= " " . implode(" ", $variable);
							}
							if ($hashtags->search[$i]) {
								if (sizeof($hashtags->search[$i]->fixed) > 0) {
									$hashtags_string .= " " . implode(" ", $hashtags->search[$i]->fixed);
								}
								if (sizeof($hashtags->search[$i]->variable) > 0) {
									$variable = array();
									for ($v = 0; $v < $hashtags->search[$i]->variable_count; $v++) {
										$test = $hashtags->search[$i]->variable[rand(0, sizeof($hashtags->search[$i]->variable) - 1)];
										if (!in_array($test, $variable)) {
											$variable[] = $test;
										}
									}
									$hashtags_string .= " " . implode(" ", $variable);
								}
							}
						}
						$cur_categories = json_decode($autopilot[0]->categories);
						$get_object_message = $mondoplayer_post->get_object(0, $url, $cur_categories, '', '', $autopilot_id, $search, $autopilot[0]->feed_video_only, $autopilot[0]->user, $hashtags_string,'' );
						if (substr($get_object_message, 0, 7) == "Created") {
							return $get_object_message;
						}
					}
				}
			}
		}
		return $get_object_message;
	}

	function autopilots_page() {
		global $wp_rewrite;
		global $wpdb;

		$message = "";
		$this->sync_autopilots();
		$views = array();

		if ( $wpdb->get_var( "SHOW TABLES LIKE 'wp_mondoplayer_ad_stats'" ) === 'wp_mondoplayer_ad_stats' ) {
			$views = $wpdb->get_results("SELECT COUNT(*) as total, autopilot_id FROM wp_mondoplayer_ad_stats WHERE add_date > DATE_SUB(CURDATE(), INTERVAL 90 DAY) AND autopilot_id > 0 GROUP BY autopilot_id", OBJECT);
		} else if ( $wpdb->get_var( "SHOW TABLES LIKE 'wp_statify'" ) === 'wp_statify' ) {
			$views = $wpdb->get_results("SELECT COUNT(*) as total, wp_postmeta.meta_value as autopilot_id FROM wp_statify, wp_posts, wp_postmeta WHERE wp_statify.created > DATE_SUB(NOW(), INTERVAL 90 DAY) AND wp_posts.post_name = REPLACE(SUBSTRING_INDEX(wp_statify.target, '/', 2), '/', '') AND wp_posts.ID = wp_postmeta.post_id AND wp_postmeta.meta_key = 'mondoplayer_autopilot_id' AND wp_statify.target <> '/' GROUP BY wp_postmeta.meta_value", OBJECT);
		}

		$is_initial = get_option('mondoplayer_initial_registration', false);
		if (isset($_GET['is_initial'])) {
			$is_initial = true;
		}
		$initial_autopilot = "var is_initial = false;";

		if ($is_initial) {
			update_option('mondoplayer_initial_registration', false);
			$initial_autopilot = "show_initial_video();";
		}

		if (isset($_GET['get_object'])) {
			$message = $this->get_object(sanitize_text_field($_GET['get_object']));
		}
		$autopilot_to_edit = 0;
		if (isset($_GET['edit'])) {
			$autopilot_to_edit = intval($_GET['edit']);
		}
		$orderby = "title";
		$order = "asc";
		if (isset($_GET["orderby"])) {
			$orderby = sanitize_text_field($_GET["orderby"]);
			$order = sanitize_text_field($_GET["order"]);
		};
		$page = "admin.php?page=mondoplayer_menu_autopilot_slug";

		$fields = array(
			"title"				=> array("Name", ";max-width: 200px", ""),
			"search_terms" 		=> array("Searches", "width: 30%;max-width:400px", ""),
			//"schedule" 		=> array("Slug", "", ""),
			"categories" 		=> array("Categories", "", ""),
			"user" 				=> array("Author", "", "max-width:100px"),
			"feed_video_only" 	=> array("Only Videos with Thumbnails", "max-width:150px", ""),
			"hashtags_string" 	=> array("Automatic Hashtags", "max-width:150px", ""),
			"count" 			=> array("Post Count<br />(90 days)", "width:90px;text-align: right", ""),
			"views" 			=> array("View Count<br />(90 days)", "width:90px;text-align: right", "")
		);

		$autopilot_id = 0;
		$title = "";
		$searches = "";
		$schedule = array();
		$feed_video_only = 0;
		$hashtags = "";
		$count = 0;
		$feed_video_only = "";
		$submit_text = "Add AutoPilot";
		$show_add_display = "block";
		$new_autopilot_display = "none";

		$categories = get_categories( array(
			'orderby' => 'name',
			'order' => 'asc',
			'hide_empty' => false,
		));
		$category_string = "[";
		foreach ( $categories as $category ) {
			if ($category->name == "Uncategorized") {
				continue;
			}
			$category_hide = 0;
			if (get_term_meta($category->term_id, "mondoplayer_hide", true )) {
				$category_hide = get_term_meta($category->term_id, "mondoplayer_hide", true );
			}
			$category_pending = -1;
			if (get_term_meta($category->term_id, "mondoplayer_pending", true )) {
				$category_pending = get_term_meta($category->term_id, "mondoplayer_pending", true );
			}

			$category_string .= "{'name':'" . $category->name. "','slug':'" . $category->slug . "','term_id':" . $category->term_id . ",'pending':'" . $category_pending . "','hide':" . $category_hide . "},";
		}
		$category_string .= "]";

		$users = get_users( array(
			'orderby' => 'nicename',
			'order' => 'asc',
			'hide_empty' => false,
		));

		$user_string = "[";
		foreach ( $users as $user ) {
			if ( $user->display_name == "mondoplayer") {
				continue;
			}
			$user_string .= "{'name':'" . $user->display_name . "','user_id':" . $user->ID . "},";
		}
		$curator = get_user_by('login', 'curator');
		$curator_user;
		if ($curator == false) {
			$user_string .= "{'name':'Curator','user_id':-2},";
			$curator_user = -2;
		} else {
			$curator_user = $curator->ID;
		}

		$user_string .= "]";

?>
<script>
var license_key = "<?php echo addslashes($this->license_key) ?>";
var is_subscribed = "<?php echo addslashes($this->is_subscribed) ?>";
var is_trial = "<?php echo addslashes($this->is_trial) ?>";
var screen_name = "<?php echo addslashes($this->screen_name) ?>";
var image_url = "<?php echo plugins_url('../images/',__FILE__) ?>";
var autopilot_list = <?php echo $this->autopilot_string ?>;
var category_list = <?php echo $category_string ?>;
var user_list = <?php echo $user_string ?>;
var curator_user = <?php echo $curator_user ?>;
var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';
var view_string = '<?php echo addslashes(json_encode($views)) ?>';
var views = JSON.parse(view_string);
var server_id = '<?php echo $this->server_id; ?>';
<?php
if ($autopilot_to_edit > 0) {
	echo "edit_autopilot_id = $autopilot_to_edit;";
}
?>

function toggle_height(div) {
	if (div.classList.contains('mondoplayer_autopilot_table_search_terms_full')) {
		div.classList.remove('mondoplayer_autopilot_table_search_terms_full');
	} else {
		div.classList.add('mondoplayer_autopilot_table_search_terms_full');
	}
}

var search_toggle = false;
function toggle_searches() {
	var divs = document.getElementsByClassName("mondoplayer_autopilot_table_search_terms");
	for (var i = 0; i < divs.length; i++) {
		if (search_toggle == false) {
			divs[i].classList.add('mondoplayer_autopilot_table_search_terms_full');
		} else {
			divs[i].classList.remove('mondoplayer_autopilot_table_search_terms_full');
		}
	}
	search_toggle = ! search_toggle;
}
var continue_to_dash = false;
var continue_to_dash_auto = false;

function show_initial_video() {
	go_to_mastermind("https://vlog.mondoplayer.com/welcome-to-mondoplayer/");
	return;

	//edit_autopilot(0);
	var div = document.createElement("div");
	div.id="video_popup";
	div.style.position="absolute";
	div.style.top = 0;
	div.style.bottom = 0;
	div.style.left = 0;
	div.style.right = 0;
	div.style.zIndex = 100000;
	div.style.backgroundColor = "#fafafafa";
	div.style.textAlign = "center";

	//	div.innerHTML = '<div id="video_popup_frame"><iframe src="https://player.vimeo.com/video/383620089?autoplay=1" frameborder="0" allow="autoplay; fullscreen" webkitallowfullscreen mozallowfullscreen allowfullscreen class="video_popup_iframe" ></iframe><p style="text-align: center"><input id="video_popup_button" type="button" value="Continue to Dashboard" onclick="continue_to_dash_auto=true;continue_to_dashboard(false)" style="cursor: pointer" /></p><p id="finish_video_message" style="display:none">Loading...</p></div>';
	div.innerHTML = '<iframe src="https://player.vimeo.com/video/383620089?autoplay=1" frameborder="0" allow="autoplay; fullscreen" webkitallowfullscreen mozallowfullscreen allowfullscreen class="video_popup_iframe" ></iframe><p style="text-align: center"><input id="video_popup_button" type="button" value="Continue to Dashboard" onclick="continue_to_dash_auto=true;continue_to_dashboard(false)" style="cursor: pointer" /></p><p id="finish_video_message" style="display:none">Loading...</p>';
	document.body.appendChild(div);
	setTimeout("continue_to_dashboard(true);continue_to_dash=true", 30000);
}
function continue_to_dashboard(finish) {
	if (continue_to_dash || (finish && continue_to_dash_auto)) {
		//document.getElementById("video_popup").innerHTML = '<div id="booking_wrapper"><div id="booking_left"><img src="https:///www.mondoplayer.com/wp-content/uploads/2016/03/Cris-crop_small.jpg" /></div><div id="booking_right"><div class="booking_title">Book A FREE Consultation With Cris Worthington</div><div class="booking_subtitle">Ready to take your business to the next level? Have a question about our services?</div><div id="booking_button">\<!-- ScheduleOnce button START --><button id="SOIBTN_MondoPlayerSearchSpecialist" style="background: #006DAF; color: #ffffff; padding: 10px 20px; border: 1px solid #c8c8c8; cursor: pointer;" data-height="580" data-psz="00" data-so-page="MondoPlayerSearchSpecialist" data-delay="1">Schedule an Appointment</button>\<!-- ScheduleOnce button END --></div></div><div id="continue_button"><input id="video_popup_button" type="button" value="Continue to Dashboard" onclick="window.location=\'admin.php?page=mondoplayer_menu_help_slug\'" style="cursor: pointer" /></div></div>';

		//var scr = document.createElement('script');
		//scr.src = "https://cdn.oncehub.com/mergedjs/so.js";
		//document.head.appendChild(scr);

		window.location='admin.php?page=mondoplayer_menu_help_slug'

	} else if (finish == false) {
		document.getElementById("finish_video_message").style.display="block";
	}
}
<?php echo $initial_autopilot ?>
</script>
<style>
#wpcontent {
	background-color: white;
}
div .form-field input[type=text], div .form-field textarea {
	width: 100%;
}
div .form-field {
	padding-bottom: 12px;
	padding-top: 12px;
	border-bottom: 2px solid #ccc;
}
div .autopilot_flex {
	display: flex;
	flex-wrap: wrap;
	padding-bottom: 8px;
}
div .autopilot_label {
	display: inline-block;
	width: 230px;
	flex-grow: 0;
	padding-top: 4px;
}
div .autopilot_content {
	flex-grow: 1;
	flex-shrink: 1;
	display: flex;
	flex-wrap: wrap;
	flex-basis: 800px;
}
div .autopilot_input {
	width: 100%;
	flex-grow: 0;
	margin-right: 12px;
}
div .autopilot_description {
	flex-basis: 400px;
	flex-grow: 2;
	flex-shrink: 2;
	padding-top: 4px;
	font-size: 13px;
}
.center_data {
	text-align: center;
}
.mondoplayer_autopilot_table_search_terms {
	height: 20px;
	cursor: pointer;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: all .2s;
}
.mondoplayer_autopilot_table_search_terms_full {
	height: auto;
	white-space: initial;
}
#video_popup_frame {
	height: 100%;
	max-height: 600px;
	width:100%;
	max-width: 1000px;
	margin-top: 5%;
	padding: 20px;
	border: 1px solid #999;
	display: inline-block;
	background-color: #ffffff;
}
.video_popup_iframe {
	height: 100%;
	max-height: 500px;
	width:100%;
	max-width: 1000px;
	margin-top: 5%;
}
@media only screen and (max-width: 1000px) {
	max-height: 300px;
}
#video_popup_button {
	background-color: rgb(238, 129, 56);
	color: white;
	font-size: 24px;
	border: 0;
	padding: 8px 20px;
	transition: color 0.2s linear, background 0.2s linear, border-color 0.2s linear, text-shadow 0.2s linear;
}
#video_popup_button:hover {
	background-color: rgb(187, 101, 44);
}
#booking_wrapper {
	display: flex;
	flex-flow: row wrap;
	justify-content: center;
	align-items: flex-end;
	background-color: white;
}
#booking_left {
	padding: 20px;
	max-width: 350px;
	width: 100%;
}
#booking_left img {
	width: 100%;
}
#booking_right {
	padding: 20px;
	max-width: 600px;
	width:100%;
}
.booking_title {
	font-family: Lato;
	font-weight: bold;
	font-size: 48px;
	padding-bottom: 18px;
	line-height: 1.25;
}
.booking_subtitle {
	font-family: Lato;
	font-weight: normal;
	font-size: 32px;
	padding-top: 20px;
	line-height: 1.25;
}
#booking_button {
	padding-top: 20px;
	width: 100%;
	text-align: center;
	font-family: Lato;
	font-weight: bold;
	font-size: 24px;
}
#continue_button {
	padding: 20px;
	width: 100%;
	text-align: center;
}
@media screen and (max-width: 1000px) {
	#booking_left {
		padding: 20px 0px;
		width: 30%
	}
	#booking_right {
		width: 60%;
		padding: 20px 0px;
		padding-left: 20px
	}
	.booking_title {
		text-align: left;
		font-size: 24px;
	}
	.booking_subtitle {
		text-align: left;
		font-size: 14px;
	}
	#booking_button {
		font-size: 14px;
	}
	.video_popup_iframe {
		max-height: 300px;
		max-width: 700px;
		margin-top: 5%;
	}
}
#search_upload_wrapper {
	display: none;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0,0,0,0.1);
	justify-content: center;
	align-items: center;
}
#search_upload {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	max-width: 1200px;
	max-height: 90%;
	background-color: white;
	padding: 12px;
}
#upload_button_wrapper {

}
#upload_autopilot_picker_wrapper {
	display: none;
}
#search_upload_detail_wrapper {
	width: 100%;
	display: none;
}
#search_upload_detail_preview {
	margin-bottom: 20px;
	max-height: 600px;
	overflow-y: scroll;
}
#search_upload_close {
	width: initial;
	display:block;
	position:absolute;
	top: 12px;
	right: 12px;
	font-size: 36px;
	color: #666;
	transition: all 0.25s;
}
#search_upload_close:hover {
	color: #ccc;
}

.hashtag_search_term {
	display: block;
	width: 100%;
	font-size: 16px;
	cursor: pointer;
	padding: 4px;
	border: 1px solid #eee;
	margin-bottom: 2px;
	color: #777;
}
.hashtag_search_term_blank {
	display: block;
	width: 100%;
	font-size: 14px;
	cursor: pointer;
	padding: 2px;
	margin-bottom: 2px;
	color: #777;
}
.selected_hashtag_search {
	background-color: #999;
	color: white;
}
#autopilot_search_hashtag_popup {
	position: fixed;
	top: 0;
	bottom: 0;
	left: -20px;
	right: 0;
	background-color: rgba(0,0,0,0.2);
	display: none;
	justify-content: center;
	align-items: center;
}
#autopilot_search_hashtag_popup_content {
	width: 100%;
	max-width: 850px;
}
#autopilot_search_hashtag_input {
	width: 200px;
}
#autopilot_search_hashtag_list {
	background-color: white;
	width: 400px;
	height: 208px;
	padding: 8px;
	overflow-y: scroll;
	overflow-x: hidden;
}
#autopilot_search_hashtag_list .tag {
	margin: 6px 8px;
}
#autopilot_search_hashtags_selected {
	background-color: white;
	width: 400px;
	height: 288px;
	padding: 8px;
	overflow-y: scroll;
	overflow-x: hidden;
	color: #777;
}
.search_cur_hashtag_entry {
	display: flex;
	margin-bottom: 8px;
	width: 100%;
}
.search_cur_hashtag_text {
	width: 100%;
	display: inline-block;
	overflow: hidden;
}
.search_cur_hashtag_toggle {
	min-width: 115px;
	display: inline-block;
}
.search_cur_hashtag_selected {
	font-weight: bold;
}
.search_no_hashtags {
	color: black;
	line-height: 1.25;
	font-size: 20px;
}
#search_upload_confirm_popup {
	display: none;
	background-color: white;
	padding: 30px;
}
</style>
<div id="autopilots_page" style='margin-right: 8px' >
<h1 id="autopilot_page_title">AutoPilots</h1>
	<p style='color: red'><?php echo $message ?></p>
	<div id='show_add_autopilot'><input type="button" class="form_submit_btn_light" value="Add New AutoPilot" onclick="edit_autopilot(0)" style='margin: 0;display: inline-block' /> <span style='float:right'><a id="get_search_csv" href='#' onclick="get_search_csv()" >Download .CSV</a> &nbsp;&nbsp;&nbsp;&nbsp;<a id="get_search_csv" href='#' onclick="open_save_search_csv()" >Upload .CSV</a></span></div>
	<div id='new_autopilot_wrapper' class='right_sub_page right_panel_form' style='display: none;background-color: white;padding: 12px;padding-top: 0;max-width: 100%'>
<form class="form" id="autopilot_form">
	<div id='autopilots_list'></div>
	<div id='autopilots_content'>
	<table id="autopilot_form_top" style='width: 100%;max-width: 1200px' cellspacing='0' cellpadding='0'><tr><td class='label_column'>AutoPilot Name</td><td class='content_column'><input type="text" class="form_field_input" id="autopilot_title" value="" placeholder="Enter a name for this autopilot" autocorrect="off" autocapitalize="off" spellcheck="true" onblur="update_autopilot_title()"><div id="autopilot_title_error" class="form_field_error"></div></td></tr>
	</table>
		<div id="autopilot_search_popup" style='display: none;margin-top: 12px;flex-flow: row wrap-reverse;justify-content: flex-start;'>
			<div style='margin-left: 0px;max-width: 1230px;flex-grow: 4;flex-shrink: 1'>
			<div id="search_advanced_autopilot" class="right_panel_search_entry"><input type="text" id="search_entry" placeholder="Add a Search to this AutoPilot" /><div class='page_button' onclick='autopilot_add_search_term("",true, true)' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0'>Add</div><div id='advanced_search_delete_button_autopilot' class='page_button' onclick='autopilot_delete_search_term();' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0' >Delete</div><div class='page_button' onclick='open_easy_search(document.getElementById("search_entry").value)' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0'>Easy</div><div id='easy_search_cancel_button_autopilot' class='page_button' onclick='autopilot_hide_search()' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0' >Cancel</div></div>
			<div id="search_easy_autopilot">
						<table cellpadding='0' cellspacing='0'>
							<tr><td class='label_column'>Must contain ALL of these Words:</td><td class='content_column'><input id='easy_search_all' type='text' placeholder='e.g. animal hospital' /></td></tr>
							<tr><td class='label_column'>YouTube Channel URL:</td><td class='content_column'><input id='easy_search_youtube' type='text' placeholder='https://www.YouTube.com/channel/abcd' /></td></tr>
							<tr style='display: none'><td class='label_column'>Hashtag:</td><td class='content_column'><input id='easy_search_hash' type='text' placeholder='e.g. #animals' /></td></tr>
							<tr><td class='label_column'>Exact Phrase:</td><td class='content_column'><input id='easy_search_phrase' type='text' placeholder='e.g. United States' /></td></tr>
							<tr><td class='label_column'>Any of these Words:</td><td class='content_column'><input id='easy_search_any' type='text' placeholder='e.g. dog cat bird fish' /></td></tr>
							<tr><td class='label_column'>None of these Words:</td><td class='content_column'><input id='easy_search_none' type='text' placeholder='e.g. hunting fishing' /></td></tr>
							<tr><td colspan='2' style='text-align: right;padding: 8px 0;color:#777;font-size: 14px'><div style='display: inline-block;text-align: left;vertical-align: middle;margin-right:18px'><input type='radio' id="search_embed_0" name='search_embed' value='0'/> Allow All Results <br /><input type='radio' id="search_embed_2" name='search_embed' value='2'/> Embedable Video and Posts Only<br /><input type='radio' id="search_embed_1" name='search_embed' value='1'/> Embedable Video Only</div> <input type='button' id='easy_search_search_button_autopilot' class='page_button' value='Add Search' onclick='autopilot_add_search_term("",false, true);' style='display: inline-block;width: auto;margin-left: 4px;' /><input type='button' id='easy_search_delete_button_autopilot' class='page_button' value='Delete' onclick='autopilot_delete_search_term();' style='display: inline-block;width: auto;' /><input type='button' id='easy_search_advanced_button_autopilot' class='page_button' value='Advanced' onclick='open_advanced_search(1)' style='display: inline-block;width: auto;margin-left: 4px' /><input type='button' id='easy_search_cancel_button_autopilot' class='page_button' value='Cancel' onclick='autopilot_hide_search()' style='display: inline-block;width: auto;margin-left: 4px' /> <img class='Explainer-Video-Icon' src='<?php echo  plugin_dir_url( __DIR__ ).'images/Explainer-Video-Icon.png'; ?>' onclick='go_to_mastermind("https://vlog.mondoplayer.com/autopilot-add-search-explainer/")' style='margin-right: 4px;margin-left: 12px;padding-bottom: 6px;' /></td></tr></table>
<div style='width: 100%;text-align: right'><div style='display: inline-block;margin-top: 8px'><span onclick='filter_popup_open()' class='blue' style='cursor:pointer;' >Content Settings</span><div id='content_filter_popup' style='z-index:10000;display:none;position:absolute;top: 0;bottom:0;left:0;right:0;background-color: rgba(0,0,0,0.1)' ><div style='width: 100%;max-width: 600px;padding: 20px;background-color: #fff;color: #777;text-align: left;margin: 50px auto 0 auto'><p style='font-size: 16px'>Most offensive videos are already blocked.</p><p style='font-size: 16px'>Only use this feature if you don't want videos that even mentions these subjects. Please note this may limit the quantity of videos you receive.</p>   <table cellpadding="6" style="width: 150px;margin: auto auto;background-color: white"><tr><td>Gore</td><td><input type='checkbox' id='content_filter_gore' /></td></tr><tr><td>Profanity</td><td><input type='checkbox' id='content_filter_profanity' /></td></tr><tr><td>Religion</td><td><input type='checkbox' id='content_filter_religion' /></td></tr><tr><td>Sex</td><td><input type='checkbox' id='content_filter_sex' /></td></tr><tr><td>Violence</td><td><input type='checkbox' id='content_filter_violence' /></td></tr></table><p style='font-size: 16px'>* We try our best to make sure all the videos you curate are appropriate, but there is no 100% guaranty.<p><p style='text-align: center'> <input type='button' class="page_button" value='Save Changes' onclick='filter_popup_save()' />&nbsp;&nbsp;<input type='button' class="page_button" value='Close' onclick='filter_popup_close()' /></p></div></div></div></div>
			</div>
		</div>
		<div id='right_panel_saved_searches' style="flex-basis: 200px;min-width: 200px;max-width: 1200px;padding:0 8px;flex-grow: 1;flex-shrink: 4;">
		<p style='color: #777'><b>Saved Searches:</b></p>
		<input type="hidden" id="save_search_name" value="" >
		<div id='topics_list'></div>
		</div>
	</div>
	<div id="autopilot_search_hashtag_popup">
		<div id="autopilot_search_hashtag_popup_content">
			<table style='width: 100%' cellspacing='0' cellpadding='0'>
				<tr><td class='label_column' style='min-width: 38px'></td><td class="content_column"><div style='font-size: 16px;color: #777;line-height: 42px'>Select or Add Hashtags</div><div id="autopilot_search_hashtag_list"></div><div style="margin-top: 4px"><div style='display: inline-block'><input type='text' id='autopilot_search_hashtag_input' value='' placeholder='Add New Hashtag' style='width: 350px;height: 38px;margin-bottom: 4px;margin-top: 6px' /><br /><input type='text' id='autopilot_search_hashtag_filter_input' value='' placeholder='Filter(s) for New Hashtag (optional)' style='width: 350px;height: 38px' /></div><input type='button' class='form_submit_btn_light rounded_right' value='+' onclick='add_search_hashtag(document.getElementById("autopilot_search_hashtag_input").value + "|" + document.getElementById("autopilot_search_hashtag_filter_input").value, 1)' style='display: inline-block;height: 38px;width: 38px;vertical-align: top; margin-top: 24px;margin-left: 4px'/></div></td><td class="content_column"><div style='font-size: 16px;color: #777;line-height: 42px;display:inline-block'>Tags for This Search</div><div style='font-size: 16px;color: #777;line-height: 42px;float:right;margin-right: 30px;display:inline-block'>All/Variable <img class='Explainer-Video-Icon' src='<?php echo  plugin_dir_url( __DIR__ ).'images/Explainer-Video-Icon.png'; ?>' onclick='go_to_mastermind("https://vlog.mondoplayer.com/adding-hashtags-to-a-search/")' style='margin-left: 18px' /></div><div id='autopilot_search_hashtags_selected'></div></td></tr>
				<tr id="autopilot_search_hashtag_variable_count_display"><td class='label_column'></td><td class='content_column' style='color: #777' colspan='2'>Include <select id="autopilot_search_hashtag_variable_count" onchange="edit_search_hashtags_variable_count = document.getElementById('autopilot_search_hashtag_variable_count').value" style='width: auto;background-color: white'></select> variable hashtags per post</td></tr>
				<tr><td class='label_column'></td><td class="content_column" colspan='2' style='text-align: right'><input type='button' class='form_submit_btn_light' value='Save Search' onclick='autopilot_finish_add_search_term();' style='display: inline-block' /> <input type='button' class='form_submit_btn_light' value='Cancel' onclick='document.getElementById("autopilot_search_hashtag_popup").style.display="none"' style='display: inline-block' /></td></tr>
			</table>
		</div>
	</div>
	<div id="autopilot_hashtags_screen1" style="display: none">
			<table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td class='label_column'>Posts to add '<span id='autopilot_hashtags_screen1_hashtag' style='word-break:break-word'></span>' to:</td><td class='content_column'><table style='width: initial' cellspacing='0' cellpadding='0'><tr><td><div class="form_field_input" id="autopilot_hashtags_search_term" style="width: 100%;max-height: 400px;overflow: scroll"></div></td><td style='width: 120px'><input type="button" value="Next" class="form_submit_btn rounded_right" style="width: auto;margin: 0;display: inline-block;border: 1px solid white;margin-left: 4px;" onclick="autopilot_hashtag_screen1_next()"><input type="button" value="Cancel" class="form_submit_btn rounded_right" style="width: auto;margin: 0;display: inline-block;border: 1px solid white;margin-left: 4px;" onclick="close_autopilot_hashtags(true)"></td></tr></table></td></tr></table>
	</div>
	<div id="autopilot_hashtags_screen2"  style="display: none">
		<table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td class='label_column'><span id='autopilot_hashtags_screen2_hashtag'></span></td><td class='content_column'><div id="autopilot_hashtag_organizer"></div></td></tr>
			<tr id="autopilot_hashtag_variable_count_display"><td class='label_column'></td><td class='content_column' style='color: #777'>Include <select id="autopilot_hashtag_variable_count" onchange="edit_search_hashtags_variable_count = document.getElementById('autopilot_hashtag_variable_count').value" style='width: auto;background-color: white'></select> variable hashtags per post</td></tr>
			<tr><td class='label_column'></td><td class='content_column' style='text-align:right'><input type="button" id="autopilots_hastags_save_button" class="form_submit_btn_light" value="Save" onclick="save_autopilot_hashtags()" style="display: inline-block;width: auto" /> <input type="button" id="autopilots_hastags_close_button" class="form_submit_btn_light" value="Cancel" onclick="close_autopilot_hashtags()" style="display: inline-block;width: auto" /></td></tr>
		</table>
	</div>
		<div id="autopilot_form_bottom" style='max-width: 1200px'>
<table style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>Searches for this AutoPilot</td><td class='content_column'><div id="autopilot_selected_keywords_error" class="form_field_error" style=''></div>

		<table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td><div id="autopilot_selected_keywords" style="padding-bottom:20px;min-height: 70px;background-color: white" onclick="autopilot_show_search(false)" ></div></td><td style='width: 95px;text-align: center;'><input type="button" id="autopilot_search_button" class="form_submit_btn rounded_right" style="width: 95px;height: 38px;margin: 0;display: inline-block;margin-left: 4px" value="Add Search" onclick="autopilot_show_search(false)" /><br /><img class='Explainer-Video-Icon' src='<?php echo  plugin_dir_url( __DIR__ ).'images/Explainer-Video-Icon.png'; ?>' onclick='go_to_mastermind("https://vlog.mondoplayer.com/autopilot-add-search-explainer/")' style='margin-top: 18px' /></td></tr></table></td></tr>
		<tr><td class='label_column'>Schedule Posts</td><td class='content_column'>
<div id="schedule_display"><div id="schedule_display_list" style="display:inline-block"></div><input type="button"value="Edit" onclick="autopilot_edit_schedule(true)" style='margin-left: 20px;vertical-align: top'/></div>
<div id="schedule_edit" style="display: none"><div id="autopilot_schedule_selector" style="margin-bottom: 10px"><select id="autopilot_schedule_day" class="form_field_input" style="width: initial;margin-right: 4px;height: 38px">
<option value="--">Day
<option value="1">Mon</option>
<option value="2">Tue</option>
<option value="3">Wed</option>
<option value="4">Thu</option>
<option value="5">Fri</option>
<option value="6">Sat</option>
<option value="0">Sun</option>
<option value="7">Mon-Fri</option>
<option value="8">Every Day</option>
</select><select id="autopilot_schedule_hour" class="form_field_input" style="width: initial;margin-right: 4px;height: 38px">
<option value="--">Time</option>
<option value="0">00:00</option>
<option value="1">01:00</option>
<option value="2">02:00</option>
<option value="3">03:00</option>
<option value="4">04:00</option>
<option value="5">05:00</option>
<option value="6">06:00</option>
<option value="7">07:00</option>
<option value="8">08:00</option>
<option value="9">09:00</option>
<option value="10">10:00</option>
<option value="11">11:00</option>
<option value="12">12:00</option>
<option value="13">13:00</option>
<option value="14">14:00</option>
<option value="15">15:00</option>
<option value="16">16:00</option>
<option value="17">17:00</option>
<option value="18">18:00</option>
<option value="19">19:00</option>
<option value="20">20:00</option>
<option value="21">21:00</option>
<option value="22">22:00</option>
<option value="23">23:00</option>
</select><input type="button" id="autopilot_schedule_button" class="form_submit_btn rounded_right" style="width: 38px;height: 38px;margin: 0;display: inline-block" value="+" onclick="autopilot_add_schedule()" />
</div>
<div id="autopilot_selected_schedules" style="padding-bottom:20px;min-height: 50px;background-color: white"></div></div></td></tr>
		<tr <?php if (get_option('mondoplayer_visitor_number', -1) > -1) { echo "style='display: none'";} ?>><td class='label_column'>Send Posts To This Service</td><td class='content_column'><div class="service_select" id='autopilot_service_select' style="width:100%"><select class="form_field_input" id="autopilot_service" style=";height: 38px"></select></div></td></tr>
	</table>

<table id="autopilot_categories_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Categories</td><td class='content_column'><select id='autopilot_categories' class="form_field_input" style='width:initial;height: 38px'></select><input type="button" id="autopilot_categories_button" class="form_submit_btn rounded_right" style="width: 38px;height: 38px;margin: 0;display: inline-block; margin-right: 30px" value="+" onclick="autopilot_add_categories()" /><input type="button" id="autopilot_categories_add_button" class="form_submit_btn rounded_right" style="height: 38px;margin: 0;display: inline-block;" value="Create New Category" onclick="autopilot_open_create_category()" /><div id="autopilot_selected_categories" style="padding-bottom:20px;min-height: 50px;background-color: white"></div></td></tr>
	<tr <?php if (get_option('mondoplayer_visitor_number', -1) > -1) { echo "style='display: none'";} ?>><td class='label_column'>Author for Posts</td><td class='content_column'><select id='autopilot_users' class="form_field_input" style='width:initial;height: 38px'></select></td></tr>
</table>

<table id="autopilot_rss_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>RSS Feed Name</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="autopilot_feed_entry"><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="autopilot_feed_title" value="" placeholder="Enter a name for this feed" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" class="form_submit_btn rounded_right" style="margin: 0;display: inline-block;width: 38px" value="+" onclick="autopilot_add_feed()"></td></tr></table></div><div id="autopilot_feed_list" style='background-color: white'></div></td><td style='width: 50px;border:0;padding:0;padding-bottom:2px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width: 50px;margin-left: 4px" value="Add" id="autopilot_add_new_feed_button" onclick="autopilot_add_new_feed('')" /></td></tr></table></td></tr>
	<tr><td class='label_column'>Feed URL</td><td class='content_column'><div id="autopilot_feed_url" style='height: 38px'></div></td></tr>
</table>
<table id="autopilot_thumbnail_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Only Post Videos with Thumbnails </td><td class='content_column' style='height: 38px;text-align: left;vertical-align: middle'><input type="checkbox" class="form_field_checkbox_input" id="autopilot_feed_video_only" value="on" onchange="autopilot_toggle_video_only()" /></td></tr>
</table>

<table id="autopilot_campaign_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Campaign</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="autopilot_campaign_entry"><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="autopilot_campaign_title" value="" placeholder="Enter a name for this campaign" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" class="form_submit_btn rounded_right" style="margin: 0;display: inline-block;width: 38px" value="+" onclick="autopilot_add_campaign()"></td></tr></table></div>
<div id="autopilot_campaign_list"></div></td><td style='width: 50px;border:0;padding:0;padding-bottom:2px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width: 50px;margin-left: 4px" value="Add" id="autopilot_add_new_campaign_button" onclick="autopilot_add_new_campaign('')"></td></tr></table></td></tr>
</table>

<table id="autopilot_email_schedule_details" style='width: 100%;display: none' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Email Address to Receive Posts</td><td class='content_column'><input type="text" class="form_field_input" id="autopilot_email_schedule_email" value="" placeholder="Enter Email Address to Receive Posts" autocorrect="off" autocapitalize="off" spellcheck="true"><div id="autopilot_email_schedule_error" class="form_field_error"></div></td></tr>
	<tr><td class='label_column'>Send Email On These Days</td><td class='content_column'><div id="autopilot_email_schedule_days">
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_1" value="on" onchange="autopilot_toggle_email_day(1)" >Mon</div>
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_2" value="on" onchange="autopilot_toggle_email_day(2)" >Tue</div>
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_3" value="on" onchange="autopilot_toggle_email_day(3)" >Wed</div>
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_4" value="on" onchange="autopilot_toggle_email_day(4)" >Thu</div>
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_5" value="on" onchange="autopilot_toggle_email_day(5)" >Fri</div>
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_6" value="on" onchange="autopilot_toggle_email_day(6)" >Sat</div>
		<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="autopilot_email_schedule_day_0" value="on" onchange="autopilot_toggle_email_day(0)" >Sun</div>
					</div></td></tr>
</table>
<table id="autopilot_domain_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Exclude Domains</td><td class='content_column'><div id='domains_display'><input type='button' value='Edit' onclick='autopilot_edit_domains(true)' /></div><div id='domains_edit' style='display: none'><div style='padding-bottom: 4px'><table style='width: initial'><tr><td style="border: 0"><input type="text" class="form_field_input" id="easy_search_options_domain_autopilot" value="" placeholder="Add a domain name" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px"></td><td style='width: 40px'><input type="button" value="+" class="page_button" style="height: 38px;width: 100%;margin: 0;display: inline-block" onclick="options_add_exclude(document.getElementById('easy_search_options_domain_autopilot').value)"></td></tr></table></div><div id='easy_search_domains_autopilot' class='easy_search_domains'></div></div></td></tr>
</table>
<table id="autopilot_api_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Account</td><td class='content_column'><select class="form_field_input" id="autopilot_api_company_picker" style="display: none;height: 38px"></select><select class="form_field_input" id="autopilot_api_initiative_picker"  style="display: none;height: 38px"></select></td></tr>
	<tr><td class='label_column'></td><td class='content_column'><div id="autopilot_api_service_picker"></div></td></tr>
</table>
<table style='width: 100%;display: none' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Automatic Hashtags</td><td class='content_column' style='color: #777'>On <div class="toggle_outside" onclick="toggle_hashtags()" ><div class="toggle_inside" id="add_hashtag_toggle" style="left: 18px"></div></div> Off</td></tr>
</table>
<table id="autopilot_hashtag_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Automatic Hashtags</td><td class='content_column'><table style='width: 400px' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="autopilot_hashtags" value="" placeholder="Add Hashtags" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px"><br /><input type="text" class="form_field_input" id="autopilot_hashtags_filters" value="" placeholder="Filter(s) for New Hashtag (optional)" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px;margin-top: 4px"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px;vertical-align: middle;'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;height: 38px;margin: 0;display: inline-block:margin-left: 4px" onclick="autopilot_add_hashtag()"></td><td style='border: 0;vertical-align: middle'><img class='Explainer-Video-Icon' src='<?php echo  plugin_dir_url( __DIR__ ).'images/Explainer-Video-Icon.png'; ?>' onclick='go_to_mastermind("https://vlog.mondoplayer.com/autopilot-add-hashtags-explainer/")' style='margin-left: 18px' /></td></tr></table></td></tr>
</table>
	<table id='autopilot_hashtags_table' style='width: 100%' cellspacing='0' cellpadding='0'><tr><td class='label_column'></td><td class='content_column'><div id="autopilot_hashtags_list"></div></td></tr>
	</table>
	<table id="autopilot_hashtag_droplet_feed" style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>RSS Feed with Hashtags in Description<br />(For social media auto-posting)</td><td class='content_column'><div id="autopilot_hashtags_droplet_feed_description_url"></div></td></tr>
		<tr><td class='label_column'>RSS Feed with Hashtags<br />(For social media auto-posting)</td><td class='content_column'><div id="autopilot_hashtags_droplet_feed_url"></div></td></tr>
	</table>
	<table id="autopilot_hashtag_feed" style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>RSS Feed URL with Hashtags</td><td class='content_column'><div id="autopilot_hashtags_feed_url"></div></td></tr>
	</table>

<div id="autopilot_keyword_picker" class="keyword_picker" onclick="hide_autopilot_keywords()" ><div id="autopilot_keyword_list" class="keyword_list"></div><div id="autopilot_keyword_buttons"><input type='button' value='Done' class="form_submit_btn_light" onclick='hide_autopilot_keywords();' style='width: auto' /></div></div>

<p class="submit"><input type="button" name="report" id="report" class="form_submit_btn_light" value="History" onclick='get_autopilot_report()' style='margin: 0;display: inline-block'> <input type="button" name="submit" id="submit" class="form_submit_btn_light" value="Save AutoPilot" onclick='save_autopilot()' style='margin: 0;display: inline-block'> <input type="button" name="autopilot_delete_button" id="autopilot_delete_button" class="form_submit_btn_light" value="Delete" onclick='delete_autopilot()' style='margin: 0;display: inline-block' > <input type='button' class="form_submit_btn_light" value='Cancel' onclick='show_add_autopilot(false)' style='margin: 0;display: inline-block'/></p>

	</div>
	</div>
</form>
<p id="autopilot_report_days_wrap" style='color: black;display: none;max-width: 1200px'><select id="autopilot_report_days" style='width: initial'>
		<option value='1'>Today</option>
		<option value='2'>Yesterday</option>
		<option value='7'>Last 7 Days</option>
		<option value='14'>Last 14 Days</option>
		<option value='30' selected>Last 30 Days</option>
		<option value='90'>Last 90 Days</option>
	</select> <input type="button" value="Update" class="form_submit_btn_light" onclick='get_autopilot_report()' style='display:inline-block; width: initial' /> <input type="button" name="report" id="report" class="form_submit_btn_light" value="Back" onclick='close_autopilot_report_details()' style='background-color: white; color: rgb(0, 115, 170); border: 1px solid rgb(0, 115, 170);margin: 0;display: inline-block;float:right' /></p>
<div id="autopilot_report_popup" class='right_sub_page right_panel_form' style="display: none">
<div id="autopilot_report_subhead"></div>

<div id="autopilot_report"></div>
<div class="form_submit_btn-wrapper" style='text-align: right;display: block'><input type="button" name="report" id="report" class="form_submit_btn_light" value="Back" onclick='close_autopilot_report_details()' style='background-color: white; color: rgb(0, 115, 170); border: 1px solid rgb(0, 115, 170);margin: 0;display: inline-block;' /></div>
</div>
<div id="autopilot_report_details_popup" class='right_sub_page right_panel_form' style="display: none">
<div id="autopilot_report_detail_subhead"></div>
<div id="autopilot_report_details"></div>
<div class="form_submit_btn-wrapper" style='display:block;text-align: right'><input type="button" name="report" id="report" class="form_submit_btn_light" value="Back" onclick='window.scrollTo(0,0);document.getElementById("autopilot_page_title").innerHTML="AutoPilot History";document.getElementById("autopilot_report_details_popup").style.display="none";document.getElementById("autopilot_report_popup").style.display="block"' style='background-color: white; color: rgb(0, 115, 170); border: 1px solid rgb(0, 115, 170);margin: 0;display: inline-block;' /></div>
</div>
</div>
<div id="autopilot_create_category_details" class='right_sub_page right_panel_form' style="display: none">
<h2 style='text-align: left;color: #777;width: 100%;max-width: 1000px;margin-left: auto;margin-right: auto'>Create a New Category</h2>
<table style='width: 100%;max-width: 1000px;margin: 0 auto' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column' style='vertical-align: middle'>Enter a name for the new category:</td><td class='content_column'><input type="text" class="form_field_input" id="autopilot_create_category" value="" placeholder="Enter a name for this category" autocorrect="off" autocapitalize="off" spellcheck="true" style='width: 50%;vertical-align: middle;margin-right: 8px' /><div style='display:inline-block;vertical-align: middle;color: #777;font-size: 16px'>Hide in Main Blogroll:&nbsp;&nbsp;<input type='checkbox' id='autopilot_create_category_hide' onclick='autopilot_hide_in_main_blogroll_checked()' /></div></td></tr>
</table>
<div class="options_popup_buttons" style='margin-bottom: 24px'><input type="button" class="form_submit_btn_light" value="Create Category" onclick="autopilot_create_category()" style='width: 200px' />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="Back" onclick="autopilot_close_create_category()" style='background-color: white; color: rgb(0, 115, 170); border: 1px solid rgb(0, 115, 170);' /></div>
</div>
<table class="wp-list-table widefat fixed striped tags" id='mondoplayer_autopilot_table' style='display: table'>
	<thead>
	<tr>
<?php
		foreach ($fields as $field => $field_array) {
			if ($field == "views" && $views == null) {
				continue;
			}

			$width = "";
			if ($field_array[1] !== "") {
				$width ="style='$field_array[1]'";
			}
			$toggle = "";
			if ($field == "search_terms") {
				$toggle = " <span onclick='toggle_searches()'>...</span>";
			}
			if ($field == $orderby) {
				$next_order = "desc";
				if ($order == "desc") {
					$next_order = "asc";
				}
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sorted $order " . $field_array[2] . "' $width><a href='$page&amp;orderby=$field&amp;order=$next_order' style='display:inline'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a>$toggle</th>";
			} else {
				if ($field == "views" || $field == "count") {
					echo "<th scope='col' id='$field' class='manage-column column-name column-primary " . $field_array[2] . "' $width><span>" . $field_array[0] . "</span></th>";
				} else {
					echo "<th scope='col' id='$field' class='manage-column column-name column-primary sortable desc " . $field_array[2] . "' $width><a href='$page&amp;orderby=$field&amp;order=asc' style='display:inline'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a>$toggle</th>";
				}
			}
		}
		echo "<th scope='col' style='width: 70px'></th>";
?>
</tr>
	</thead>
	<tbody id="the-list" data-wp-lists="list:tag">
<?php

$autopilot_views = array();
$unmatched_views = array();
if (is_array($views)) {
	foreach ($views as $view) {
		if (isset($autopilot_views[$view->autopilot_id])) {
			$autopilot_views[$view->autopilot_id] += $view->total;
		} else {
			$autopilot_views[$view->autopilot_id] = $view->total;
		}
	}
}

$total_views = 0;
$total_posts = 0;

foreach ( $this->autopilots->autopilots as $autopilot ) {
	$class = "";

	echo "<tr id='tag-" . $autopilot->autopilot_id . "' style='display: table-row;'>";

	foreach ($fields as $field => $field_array) {
		if ($field == "views" && $views == null) {
			continue;
		}
		$class = "";
		if ($field_array[2] !== "") {
			$class = $field_array[2] . " ";
		}
		if ($field == "title") {
			$class .= "column-primary";
			echo "<td class='$class' data-colname='$field'><a class='row-title' href='#' onclick='edit_autopilot(" . $autopilot->autopilot_id . ")'>" . $autopilot->$field . "</a></td>";
		} else if ($field == "categories") {
			$categories_string = "";
			$cur_categories = json_decode($autopilot->categories);
			for ($i = 0; $i < sizeof($cur_categories); $i++ ) {
				if ($categories_string != "") {
					$categories_string .= ", ";
				}
				$categories_string .= $cur_categories[$i]->name;
			}
			echo "<td class='$class' data-colname='$field'>$categories_string</td>";
		} else if ($field == "user") {
			if ($autopilot->$field == 0) {
				$autopilot->$field = 1;
			}
			$user = get_userdata($autopilot->$field);
			echo "<td class='$class' data-colname='$field'>$user->display_name</td>";
		} else if ($field == "hashtags_string") {
			if ($autopilot->$field == "") {
				echo "<td class='$class' data-colname='$field'>No</td>";
			} else {
				$hashtags = json_decode($autopilot->$field);
				if ($hashtags->active == 1) {
					echo "<td class='$class' data-colname='$field'>Yes</td>";
				} else {
					echo "<td class='$class' data-colname='$field'>No</td>";
				}
			}
		} else if ($field == "feed_video_only") {
			if ($autopilot->$field == "") {
				echo "<td class='$class' data-colname='$field'>No</td>";
			} else {
				echo "<td class='$class' data-colname='$field'>Yes</td>";
			}
		} else if ($field == "count") {
			if ($autopilot->service == 15) {

				$min_date = date('Y-m-d', strtotime("-90 days"));
				$posts_array = array(
					'date_query' => array(
						'after' => $min_date,
					),
					'meta_query' => array(
						array(
							'key' => 'mondoplayer_autopilot_id',
							'value' => $autopilot->autopilot_id
						),
					)
				);

				$post_query = new WP_Query($posts_array);
				$total_posts += $post_query->found_posts;
				echo "<td class='$class' style='text-align: right' data-colname='$field'>" . number_format($post_query->found_posts) . "</td>";
			} else {
				echo "<td class='$class' style='text-align: right' data-colname='$field'>0</td>";
			}
		} else if ($field == "views") {
			if ($autopilot->service == 15 && isset($autopilot_views[$autopilot->autopilot_id])) {
				$total_views += $autopilot_views[$autopilot->autopilot_id];
				echo "<td class='$class' style='text-align: right' data-colname='$field'>" . number_format($autopilot_views[$autopilot->autopilot_id]) . "</td>";
			} else {
				echo "<td class='$class' style='text-align: right' data-colname='$field'>0</td>";
			}
		} else if ($field == "search_terms") {
			$search_term_labels = array();
			$search_terms_string = "";
			$search_terms_split = explode("|", $autopilot->$field);
			$search_terms_title_split = explode("|", $autopilot->search_terms_title);
			for ($i = 0; $i < sizeof($search_terms_split); $i++) {
				$search_terms_split[$i] = str_replace("&vlog", "", $search_terms_split[$i]);
				$search_terms_split[$i] = str_replace("&embed", "", $search_terms_split[$i]);
				if ($search_terms_title_split[$i] != "") {
					$cur_search = trim(preg_replace("/youtube \S* \S*/", "", $search_terms_split[$i]));
					if ($cur_search == "") {
						$search_term_labels[] = "'" . urldecode($search_terms_title_split[$i]) . "' on YouTube";
					} else {
						$search_term_labels[] = "'" . urldecode($search_terms_title_split[$i]) . "' on YouTube" . " (" . $cur_search . ")";
					}
				} else {
					$search_term_labels[] = $search_terms_split[$i];
				}
			}
			uasort($search_term_labels, function ($a, $b) {
				if (substr($a, 0, 1) == "'" && substr($b, 0, 1) != "'") {
					return 1;
				}
				if (substr($a, 0, 1) != "'" && substr($b, 0, 1) == "'") {
					return -1;
				}
				return strcasecmp($a,$b);
			});
			echo "<td class='$class' data-colname='$field'><div class='mondoplayer_autopilot_table_search_terms' onclick='toggle_height(this)'>" . implode(" &nbsp;&nbsp;", $search_term_labels) . "</div></td>";
		} else {
			echo "<td class='$class' data-colname='$field'>" . $autopilot->$field . "</td>";
		}
	}
	#if ($autopilot->service == 15) {
	#	echo "<td class=''><input type='button' value='Edit' onclick='edit_autopilot(" . $autopilot->autopilot_id . ")' /><input type='button' value='Get Object' onclick='window.location=\"admin.php?page=mondoplayer_menu_autopilot_slug&get_object=" . $autopilot->autopilot_id . "\"' /></td>";
	#} else {
		echo "<td class='' style='width: 70px'><input type='button' value='Edit' onclick='edit_autopilot(" . $autopilot->autopilot_id . ")' /></td>";
	#}
	echo "</tr>";
}
?>
	<tr id='tag-table_total'><td style="font-size: 14px"><b>Total:</b></td><td></td><td></td><td></td><td></td><td></td><td style="border-top: 1px solid #141414;text-align: right"><?php echo number_format($total_posts) ?></td><td style="border-top: 1px solid #141414;text-align: right"><?php echo number_format($total_views) ?></td></tr>
</tbody>
	<tfoot>
	<tr>
<?php
		foreach ($fields as $field => $field_array) {
			if ($field == "views" && $views == null) {
				continue;
			}
			$width = "";
			if ($field_array[1] !== "") {
				$width ="style='$field_array[1]'";
			}

			$toggle = "";
			if ($field == "search_terms") {
				$toggle = " <span onclick='toggle_searches()'>...</span>";
			}
			if ($field == $orderby) {
				$next_order = "desc";
				if ($order == "desc") {
					$next_order = "asc";
				}
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sorted $order' $width><a href='$page&amp;orderby=$field&amp;order=$next_order' style='display:inline'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a>$toggle</th>";
			} else {
				if ($field == "views" || $field == "count") {
					echo "<th scope='col' id='$field' class='manage-column column-name column-primary " . $field_array[2] . "' $width><span>" . $field_array[0] . "</span></th>";
				} else {
					echo "<th scope='col' id='$field' class='manage-column column-name column-primary sortable desc " . $field_array[2] . "' $width><a href='$page&amp;orderby=$field&amp;order=asc' style='display:inline'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a>$toggle</th>";
				}
			}
		}
		echo "<th scope='col'></th>";

?>
</tr>
	</tfoot>

</table>

	</div>
<div id='search_upload_wrapper'>
<div id="search_upload">
<div id='upload_button_wrapper'>
<h2>Upload .CSV with Searches</h2>
<input type='file' id='csv_file' /> <input type="button" class="form_submit_btn_light" value="Upload .CSV" onclick="open_search_csv()" style='margin: 0;display: inline-block' /> <input type="button" class="form_submit_btn_light" value="Back" onclick="close_save_search_csv()" style='background-color: white; color: rgb(0, 115, 170); border: 1px solid rgb(0, 115, 170); margin: 0;margin-left: 70px;display: inline-block' />
</div>
<div id='search_upload_detail_wrapper'>
<h2 id='search_upload_detail_title'></h2>
<div id='search_upload_autopilot_picker_wrapper'><select id="search_upload_autopilot_picker" onchange='select_autopilot_upload()'></select></div>
<div id='search_upload_detail_preview'></div>
<div id='search_upload_detail_buttons'><input type="button" id="skip_autopilot_searches" class="form_submit_btn_light" value="Skip This Autopilot" onclick="process_csv_autopilots()" style='margin: 0;display: inline-block' /> <input type="button" id="add_autopilot_searches" class="form_submit_btn_light" value="Update Autopilot" onclick="continue_csv_searches()" style='margin: 0;display: inline-block' /> <input type="button" class="form_submit_btn_light" value="Back" onclick="close_save_search_csv()" style='background-color: white; color: rgb(0, 115, 170); border: 1px solid rgb(0, 115, 170); margin: 0;display: inline-block;float: right' /></div>
</div>

</div>
<div id='search_upload_confirm_popup'><h2 id='search_upload_confirm_title'></h2>
<p>To confirm updating of the AutoPilot, type "DO IT" in the box below and click Continue</p>
<p><input id="search_upload_confirm_text" value= "" /></p>
<p><input type="button" id="add_autopilot_searches" class="form_submit_btn_light" value="Continue" onclick="update_csv_searches()" style='margin: 0;display: inline-block' /> <input type="button" id="add_autopilot_searches" class="form_submit_btn_light" value="Cancel" onclick="close_search_upload_confirm()" style='margin: 0;display: inline-block' /></p>
</div>
</div>
<?php
	}
}

