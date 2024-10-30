<?php
/*
	Plugin Name: MondoPlayer
	Plugin URI: https://www.mondoplayer.com/
	Description: Video Content Curation Plugin - automatically curate and share videos. Boost engagement on your website and in social media with compelling video.
	Author: MondoTag
	Version: 1.0.369
	Tested up to: 5.7.3
	License: GPLv2 or later
*/

/*
	Copyright 2020 MondoPlayer (email : info@mondoplayer.com)
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_registration.php');

// TODO: rename this class
class MondoPlayer {
	public $path;
	public $wp_plugin_page;
	public $mondoplayer_plugin_page;
	public $mondoplayer_plugin_name;
	public $mondoplayer_plugin_menu;
	public $mondoplayer_plugin_slug;
	public $mondoplayer_plugin_ref;
	public $mondoplayer_registration;
	public $mondoplayer_search;
	public $images_url;
	public $db_version = "1.4";

	private static $instance;
	public static function get_instance() {
		if (null === self::$instance) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct(){
		$this->path = plugin_dir_path( __FILE__ );
		$this->wp_plugin_page = "http://wordpress.org/plugins/mondoplayer";
		$this->mondoplayer_plugin_page = "https://www.mondoplayer.com/";
		$this->mondoplayer_plugin_name = "MondoPlayer";
		$this->mondoplayer_plugin_menu = "MondoPlayer Menu";
		$this->mondoplayer_plugin_slug = "mondoplayer-plugin";
		$this->mondoplayer_plugin_ref = "mondoplayer_plugin";
		$this->images_url = plugins_url("images/",__FILE__);

		add_shortcode( 'mondoplayer_featured_image_url', array($this, 'featured_image_url'));
		add_filter( 'cron_schedules', array($this, 'mp_cron_schedule'));
		add_action( 'mondoplayer_job_cron', array($this, 'cron_job'));
		add_action( 'mondoplayer_autopilot_cron', array($this, 'cron_autopilot'));
		add_action( 'mondoplayer_daily_cron', array($this, 'cron_daily'));

		add_action( 'pre_get_posts', array($this, 'filter_posts'));
		add_filter( 'pre_get_posts', array($this, 'filter_abridged_rss'), 20 );
		add_action( 'posts_where', array($this, 'posts_where'), 10, 2);
		add_filter( 'posts_orderby', array($this, 'filter_posts_orderby'), 10, 2);
		add_filter( 'the_content', array($this, 'filter_content'));
		add_filter( 'document_title_parts', array($this, 'filter_feed_title_rss'));
		add_filter( 'the_title_rss', array($this, 'filter_title_rss'));
		add_filter( 'the_excerpt_rss', array($this, 'filter_excerpt_rss'));
		add_action( 'rss2_ns',  array($this, 'add_media_namespace_rss' ));
		add_action( 'rss2_item',  array($this, 'add_media_thumbnail_rss' ));

		add_action( 'template_redirect', array($this, 'filter_410'), -1);
		add_filter( 'do_redirect_guess_404_permalink', array($this, 'stop_redirect_guess'));

		add_action( 'plugins_loaded', array($this, 'setup_plugin') );
		add_action( 'admin_notices', array($this,'admin_notices'), 11 );
		add_action( 'network_admin_notices', array($this, 'admin_notices'), 11 );
		add_action( 'admin_menu', array($this,'menu_pages'), 20 );
		add_action( 'admin_enqueue_scripts', array($this, 'admin_assets') );
		//add_action( 'init', array($this, 'register_category_meta'));
		add_action( 'admin_post_mondoplayer', array($this, 'process_form'));

		add_action( 'created_category', array($this, 'save_meta'));
		add_action( 'edited_category', array($this, 'save_meta'));
		add_action( 'mondoplayer_new_autopilot', array($this, 'new_autopilot'));

		register_deactivation_hook( __FILE__, array($this, 'deactivate_plugin' ));
		register_activation_hook( __FILE__, array($this, 'setup_database'));

		$this->mondoplayer_registration = new MondoPlayer_Registration();
	}

	function mp_cron_schedule( $schedules ) {
    	$schedules[ 'mp_15_min' ] = array( 'interval' => 900, 'display' => __( '15 Minutes' ) );
	    return $schedules;
	}

	function setup_plugin() {
		$db = get_option("mondoplayer_db_version", '');
		if ($db != $this->db_version) {
			$this->setup_database();
		}
	}

	function new_autopilot() {
		require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_autopilot.php');
		$mondoplayer_autopilot = new MondoPlayer_Autopilot();
		$mondoplayer_autopilot->new_autopilot();
	}

	function setup_database() {
		global $wpdb;

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

		$charset_collate = $wpdb->get_charset_collate();

		$table_name = $wpdb->prefix . 'mondoplayer_deleted_posts';
		$sql = "CREATE TABLE " . $table_name . " (
			url varchar(191) not null,
			category varchar(255) not null,
			PRIMARY KEY (url)
		) $charset_collate;";
		error_log("Create: " . json_encode(dbDelta( $sql )));

		$table_name = $wpdb->prefix . 'mondoplayer_autopilot';
		$sql = "CREATE TABLE $table_name (
			autopilot_id int unsigned not null,
			title text not null,
			search_terms text not null,
			search_terms_date text not null,
			search_term_index tinyint not null,
			feed_video_only tinyint not null,
			schedules text not null,
			hashtags text not null,
			user int not null,
			categories text not null,
			PRIMARY KEY (autopilot_id)
		) $charset_collate;";
		error_log("Create: " . json_encode(dbDelta( $sql )));

		$table_name = $wpdb->prefix . 'mondoplayer_autopilot_schedule';
		$sql = "CREATE TABLE " . $table_name . " (
			autopilot_id int unsigned not null,
			day tinyint not null,
			hour tinyint not null
		) $charset_collate;";
		error_log("Create: " . json_encode(dbDelta( $sql )));

		$table_name = $wpdb->prefix . 'mondoplayer_visitor_tracking';
		$sql = "CREATE TABLE " . $table_name . " (
			autopilot_id int unsigned not null,
			day tinyint not null,
			hour tinyint not null
		) $charset_collate;";
		error_log("Create: " . json_encode(dbDelta( $sql )));

		$table_name = $wpdb->prefix . 'mondoplayer_special_domains';
		$sql = "CREATE TABLE " . $table_name . " (
			domain varchar(64) not null,
			search varchar(128) not null,
			update_date datetime not null,
			search_url text not null,
			INDEX domain (domain),
			index search (search)
		) $charset_collate;";
		error_log("Create: " . json_encode(dbDelta( $sql )));

		update_option( 'mondoplayer_db_version', $this->db_version );

		if (! wp_next_scheduled ( 'mondoplayer_autopilot_cron' )) {
			wp_schedule_event(time(), 'hourly', 'mondoplayer_autopilot_cron');
		}
		if (! wp_next_scheduled ( 'mondoplayer_job_cron' )) {
			wp_schedule_event(time(), 'mp_15_min', 'mondoplayer_job_cron');
		}
		if (! wp_next_scheduled ( 'mondoplayer_daily_cron' )) {
			wp_schedule_event(strtotime('tomorrow midnight'), 'daily', 'mondoplayer_daily_cron');
		}

		wp_redirect( admin_url('/admin.php?page=mondoplayer_menu_slug'));
	}

	function deactivate_plugin(){
		error_log("Deactivating plugin");
		delete_option( 'mondoplayer_license_key');
		$timestamp = wp_next_scheduled( 'mondoplayer_job_cron' );
		wp_unschedule_event( $timestamp, 'mondoplayer_job_cron', array($this, 'cron_job') );
		$timestamp = wp_next_scheduled( 'mondoplayer_autopilot_cron' );
		wp_unschedule_event( $timestamp, 'mondoplayer_autopilot_cron', array($this, 'cron_autopilot') );
		$timestamp = wp_next_scheduled( 'mondoplayer_daily_cron' );
		wp_unschedule_event( $timestamp, 'mondoplayer_daily_cron', array($this, 'cron_daily') );
	}

	function admin_notices(){
		//$notice_option = get_option("mondoplayer_show_notification", 0);
		//if ( $notice_option == 1) {
		//	echo "<div class='updated'><p>You have new MondoPlayer notifications, <a href='admin.php?page=mondoplayer_menu_notifications_slug'>please click here</p></div>";
		//}
	}

	function admin_assets($page){
		wp_register_style( $this->mondoplayer_plugin_slug, plugins_url("css/web_player.css",__FILE__), false, '1.0.53' );
		wp_register_script( $this->mondoplayer_plugin_slug, plugins_url("js/web_player_v2.js",__FILE__), false, '1.0.128' );
		$db = get_option("mondoplayer_db_version", '');
		if ($db != $this->db_version) {
			$this->setup_database();
		}
		if( strpos($page, "mondoplayer_menu") !== false || strpos($page, "mondoplayer_turnkey") !== false  ){
			wp_enqueue_style( $this->mondoplayer_plugin_slug );
			wp_enqueue_script( $this->mondoplayer_plugin_slug );
		}
	}

	function filter_posts($query){
		global $wpdb;
		global $mondoplayer_mastermind;
		#error_log("filter_posts: $mondoplayer_mastermind");
		if ( $query->is_home() && $query->is_main_query() ) {
			$categories = get_categories( array(
				'hide_empty' => false,
			));
			$hide_categories = "";

			for ($i = 0; $i < count($categories);$i++) {
				$category_meta = get_term_meta($categories[$i]->term_id, '', true);
				if (isset($category_meta['mondoplayer_hide'][0]) && $category_meta['mondoplayer_hide'][0] == 1) {
					if ($hide_categories != "") {
						$hide_categories .= ",";
					}
					$hide_categories .= "-" . $categories[$i]->term_id;
				}
				if ($mondoplayer_mastermind == 0) {
					if (isset($category_meta['mondoplayer_mastermind'][0]) && $category_meta['mondoplayer_mastermind'][0] == 1) {
						if ($hide_categories != "") {
							$hide_categories .= ",";
						}
						$hide_categories .= "-" . $categories[$i]->term_id;
					}
				}
			}
			$query->set( "cat", $hide_categories);
		}

		$query->set('orderby', array('post_date' => 'DESC'));

		return $query;
	}

	function posts_where ($where, $query) {
		$pinned_or = "";
		if (is_singular()) {
			return $where;
		}
		if (is_feed()) {
			return $where;
		}
		$category_id = get_query_var('cat', 0);
		$mondoplayer_mastermind = get_term_meta($category_id, 'mondoplayer_mastermind', true);
		if (isset($mondoplayer_mastermind['mastermind']) && $mondoplayer_mastermind['mastermind'] == 1) {
			return $where;
		}

		if ( (! is_admin() && $query->is_main_query()) || (isset( $_REQUEST['action']) &&  $_REQUEST['action'] == "get_vlog") ) {
			$pinned = get_option('mondoplayer_pinned_blog_all', array());
			if (sizeof($pinned) > 0) {
				for ($i = 0; $i < sizeof($pinned); $i++) {
					$pinned_or .= " OR wp_posts.ID=" . $pinned[$i] . " ";
				}
			}
		}

		if (isset( $_REQUEST['action']) &&  $_REQUEST['action'] == "get_slider_objects") {
			$pinned = get_option('mondoplayer_pinned_slider_all', array());
			if (sizeof($pinned) > 0) {
				for ($i = 0; $i < sizeof($pinned); $i++) {
					$pinned_or .= " OR wp_posts.ID=" . $pinned[$i] . " ";
				}
			}
		}

		return $where . $pinned_or;
	}

	function filter_posts_orderby($orderby, $wp_query) {
		if (is_feed()) {
			return $orderby;
		}

		#$theme = wp_get_theme();
		$category_id = get_query_var('cat', 0);
		#error_log("filter posts category_id: " . $category_id);
		$pinned = array();
		if (! is_admin() && $wp_query->is_home() && $wp_query->is_main_query()) {
			$pinned = array_merge(get_option('mondoplayer_pinned_blog_all', array()), get_option('mondoplayer_pinned_blog', array()));
		} else if (! is_admin() && $category_id > 0 && $wp_query->is_main_query()) {
			$mondoplayer_mastermind = get_term_meta($category_id, 'mondoplayer_mastermind', true);
			if (isset($mondoplayer_mastermind['mastermind']) && $mondoplayer_mastermind['mastermind'] == 1) {
				return $orderby;
			}
			$category_pinned = get_term_meta($category_id, 'mondoplayer_pinned_blog', true);
			#error_log("category_pinned: " . print_r($category_pinned, TRUE));
			if (! isset($category_pinned) || $category_pinned == null) {
				$category_pinned = array();
			}
			$pinned = array_merge(get_option('mondoplayer_pinned_blog_all', array()), $category_pinned);
		} else if (isset( $_REQUEST['action'])) {
			$category_id = 0;
			if (isset($_REQUEST['category'])) {
				$category_id = intval($_REQUEST['category']);
			}
			#error_log("action query: " .$_REQUEST['action'] );
			if ($_REQUEST['action'] == "get_vlog") {
				$category_pinned = array();
				if (isset( $_REQUEST['category']) && $_REQUEST['category'] > 0) {
					$category_pinned = get_term_meta($category_id, 'mondoplayer_pinned_blog', true);
					if (! isset($category_pinned_meta) || $category_pinned == null) {
						$category_pinned = array();
					}
				} else {
					$category_pinned = get_option('mondoplayer_pinned_blog', array());
				}
				$pinned = array_merge(get_option('mondoplayer_pinned_blog_all', array()),  $category_pinned);
			} else if ($_REQUEST['action'] == "get_slider_objects") {
				$category_pinned = array();
				if (isset( $_REQUEST['category']) && $_REQUEST['category'] > 0) {
					$category_pinned = get_term_meta($category_id, 'mondoplayer_pinned_slider', true);
					#error_log("mondoplayer_pinned_slider: " . print_r($category_pinned, TRUE));
					if (! isset($category_pinned) || $category_pinned == null) {
						$category_pinned = array();
					} else {
						get_option('mondoplayer_pinned_slider', array());
					}
				}
				$pinned = array_merge(get_option('mondoplayer_pinned_slider_all', array()),  $category_pinned);
			}
		}

		if (sizeof($pinned) > 0) {
			$new_order = "";
			for ($i = 0; $i < sizeof($pinned); $i++) {
				if ($new_order != "") {
					$new_order .= ", ";
				}
				$new_order .= "wp_posts.ID=" .$pinned[$i] . " DESC";
			}
			#error_log("new_order: " . $new_order);
			return $new_order. ", wp_posts.post_date DESC";
		}

		return $orderby;
	}

	function featured_image_url($att) {
		global $post;
		return get_the_post_thumbnail_url($post->ID);
	}

	function filter_content($content) {
		if (is_singular() && in_the_loop() && is_main_query()) {
			$post_meta = get_post_meta($GLOBALS['post']->ID, '', true);

			if (isset($post_meta['mondoplayer_object'][0]) && $post_meta['mondoplayer_object'][0] == 1 && $post_meta['mondoplayer_origional_url'][0] != "") {
				$categories = wp_get_object_terms($GLOBALS['post']->ID, 'category');
				$category_meta = get_term_meta($categories[0]->term_id, '', true);
				$read_more = "";
				$read_more_text = "Watch/Read More";
				if (! isset($category_meta['mondoplayer_add_links'][0]) || $category_meta['mondoplayer_add_links'][0] == 1) {
					$color = "#000";
					if(isset($category_meta['mondoplayer_read_more_color'][0]) && $category_meta['mondoplayer_read_more_color'][0] != "") {
						$color = $category_meta['mondoplayer_read_more_color'][0];
					}
					if(isset($category_meta['mondoplayer_read_more_text'][0]) && $category_meta['mondoplayer_read_more_text'][0] != "") {
						$read_more_text = $category_meta['mondoplayer_read_more_text'][0];
					}

					$object_url = $post_meta['mondoplayer_origional_url'][0];
					$read_more = '<style>.mp_trans{-webkit-transition:all 0.3s ease-in-out;-moz-transition:all 0.3s ease-in-out;-o-transition:all 0.3s ease-in-out;transition:all 0.3s ease-in-out;}#mp_g{fill:#c1c1c1;transform:rotate(0deg);transform-origin:50% 50%;-moz-transform-origin:56px 56px;} #mp_g #mp_pc{stroke:#c1c1c1;} #mp_g #mp_pt{fill:#c1c1c1;} #mp_g:hover{fill:#c1c1c1;transform:rotate(359.9deg);transform-origin:50% 50%;-moz-transform-origin:56px 56px;} #mp_g:hover #mp_pc{stroke:#111;} #mp_g:hover #mp_pt{fill:#111;} #mp_g:active{fill:#c1c1c1;transform:rotate(359.9deg);transform-origin:50% 50%;-moz-transform-origin:56px 56px;} #mp_g:active #mp_pc{stroke:#111;} #mp_g:active #mp_pt{fill:#111;} .mp_d{top:50%;margin-top:-60px}@media screen and (max-width:400px){.mp_d{top:30px;}}.mp_read_more {display: block;width: 200px !important;background-color: ' . $color . ';text-align: center !important;color: white !important;text-decoration: none !important;margin: 10px auto;cursor: pointer;transition: background-color 0.5s ease;}.mp_read_more:hover {background-color: #777;color: white;}</style>';
					if (!isset($category_meta['mondoplayer_read_more'][0]) || $category_meta['mondoplayer_read_more'][0] == 1) {
						$read_more .= '<a class="mp_read_more" href=' . $object_url . ' target="_blank">' . $read_more_text . '</a>';
					}
					if ($category_meta['mondoplayer_video_thumbnail'][0] == 1 && $post_meta['mondoplayer_embedded'][0] == 0) {
						$read_more .= '<div id="mp_wrapper" style="position:relative;max-width:500px;margin-top: 20px;display:none"><a href="' . $object_url . '"  rel="nofollow" target="_blank"><img id="mp_d_img" onload="mp_d_top()" src="[mondoplayer_featured_image_url]" style="width:100%" /><div id="mp_d" class="mp_d" style="position:absolute;width:120px;left:50%;margin-left:-60px"><svg viewBox="0 0 112 112" width="100%" height="100%"><g id="mp_g" class="mp_trans" width="112" height="112"><rect width="112" height="112" id="mp_pb" style="fill-opacity:0"/><path d="m 81,56 -40,20.4 0,-40.8 40,20.4 z" id="mp_pt"/><circle cx="56" cy="56" r="54" id="mp_pc" style="fill:none;stroke-width:3.8"/></g></svg></div></a></div><script>function mp_d_top() {if(document.getElementById("mp_d_img").getAttribute("src") == "") { return;} document.getElementById("mp_wrapper").style.display="block";document.getElementById("mp_d").style.top = Math.round(document.getElementById("mp_d_img").clientHeight/2 - 60) + "px";document.getElementById("mp_d").style.marginTop = 0;}setTimeout("mp_d_top()",5000);if ("' . $object_url . '".match("youtube.com") || "' . $object_url . '".match("youtu.be")){document.getElementById("mp_wrapper").style.display="none";}</script>';
					}
				}
				if (isset($category_meta['mondoplayer_video_above'][0]) && $category_meta['mondoplayer_video_above'][0] == 0) {
					return $read_more . $content;
				} else {
					return  $content . $read_more;
				}
			}
		}
		return $content;
	}
	function filter_feed_title_rss($title) {
		if (!is_feed()) {
			return $title;
		}
		if ($title['title'] == "") {
			$title['title'] = "Full site";
		}
		if (isset($_GET['abridged'])) {
			$title['title'] .= " - abridged";
		}

		if (isset($_GET['hashtags'])) {
			$title['title'] .= " (hashtags with title)";
		}
		if (isset($_GET['hashtags_with_description'])) {
			$title['title'] .= " (hashtags with description)";

		}
		return $title;
	}
	function filter_abridged_rss($query) {
		#error_log("Filtering rss: " . $query->is_feed . " - " . $query->is_main_query() . " - " . isset($_GET['abridged']));
		if( $query->is_feed && $query->is_main_query() && isset($_GET['abridged'])) {
			global $wpdb;
			$posts = $wpdb->get_results("SELECT wp_posts.ID as ID from wp_posts, wp_postmeta WHERE wp_posts.ID = wp_postmeta.post_id AND wp_posts.post_type = 'post' AND wp_posts.post_date >= date_sub(NOW(), interval 36 hour) AND wp_posts.post_date < date_sub(NOW(), interval 6 hour) AND wp_postmeta.meta_key = 'mondoplayer_autopilot_id'");
			$post_sql = "";
			foreach ($posts as $post) {
				$post_sql .= $post->ID . ",";
			}
			$abridged_posts = array();
			if ($post_sql != "") {
				$category_id = get_query_var('cat', 0);
				if ($category_id == 0) {
					$abridged_posts = $wpdb->get_results("SELECT count(*) as count, post_id FROM wp_mondoplayer_ad_tracking WHERE post_id > 0 AND add_date > date_sub(now(), interval 36 hour) AND autopilot_id > 0 AND post_id IN (" . substr($post_sql, 0, -1) . ") group by post_id order by count desc limit 2");
				} else {
					$abridged_posts = $wpdb->get_results("SELECT count(*) as count, post_id FROM wp_mondoplayer_ad_tracking WHERE post_id > 0 AND add_date > date_sub(now(), interval 36 hour) AND autopilot_id > 0 AND post_id IN (" . substr($post_sql, 0, -1) . ") AND category_id = $category_id group by post_id order by count desc limit 2", ARRAY_A);
				}
				if (is_wp_error($abridged_posts)) {
					$error_message = $abridged_posts>get_error_message();
					error_log("Error selecting abridged posts " . $error_message);
					return $query;
				}
			}
			$post_ids = array();
			foreach ($abridged_posts as $post) {
				$post_ids[] = $post->post_id;
			}
			if (empty($post_ids)) {
				$query->set('post__in', array(-1));
			} else {
				$query->set('post__in', $post_ids);
			}
			$query->set('orderby', 'post__in');
		}
		return $query;
	}

	function filter_title_rss($title) {
		#error_log("Filtering title: $title");
		if (isset($_GET['hashtags'])) {
			global $post;
			$hashtags = get_post_meta($post->ID, 'mondoplayer_hashtags', true);
			#error_log("hashtags: $hashtags");
			if (! empty($hashtags)) {
				if (strpos($title, "[Video]") === false) {
					return $title . " " . $hashtags;
				} else {
					return substr($title, 0, strpos($title, "[Video]")) . "$hashtags [Video]";
				}
			}
		}
		return $title;
	}
	function filter_excerpt_rss($excerpt) {
		#error_log("Filtering title: $title");
		global $post;
		if (isset($_GET['rss_message'])) {
			$hashtags = get_post_meta($post->ID, 'mondoplayer_hashtags', true);
			$terms = get_the_terms($post, 'category');
			$rss_message = get_option('mondoplayer_rss_message', "🎥 Link in Profile for Video");
			if ($terms) {
				$test_message = get_term_meta($terms[0]->term_id, 'category_rss_message', true);
				if ($test_message != "") {
					$rss_message = $test_message;
				}
			}
			if (! isset($_GET['hashtags_with_description'])) { 
				return $rss_message . " " . $hashtags . " " . $excerpt;
			} else {
				$excerpt = $rss_message . " " . $excerpt;
			}
		}
		if (isset($_GET['hashtags_with_description'])) {
			$hashtags = get_post_meta($post->ID, 'mondoplayer_hashtags', true);
			if ($post->post_name != "") {
				$end_string = "\n\n" . home_url( user_trailingslashit( $post->post_name ) );
			} else {
				$end_string = "\n\n" . get_post_permalink($post->ID, true);
			}
			#error_log("hashtags: $hashtags");
			if (! empty($hashtags)) {
				$end_string .= "\n\n" . $hashtags;
			}
			return substr($excerpt, 0, 500 - strlen($end_string)) . $end_string;
		}
		return $excerpt;
	}
	function add_media_namespace_rss() {
 		echo "xmlns:media=\"http://search.yahoo.com/mrss/\"\n";
	}
	function add_media_thumbnail_rss() {
  		global $post;
		if( has_post_thumbnail( $post->ID )) {
			$thumb_ID = get_post_thumbnail_id( $post->ID );
			$details = wp_get_attachment_image_src($thumb_ID, 'large');
			if( is_array($details) ) {
				echo '<media:thumbnail url="' . $details[0] . '" width="' . $details[1] . '" height="' . $details[2] . '" />';
			}
		}
	}

	function cron_job() {
		if (! wp_next_scheduled ( 'mondoplayer_autopilot_cron' )) {
			wp_schedule_event(time(), 'hourly', 'mondoplayer_autopilot_cron');
		}
		require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_cron.php');
		$cron = new MondoPlayer_Cron();
		$cron->finish_pending_posts();
	}

	function cron_autopilot() {
		require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_cron.php');
		$cron = new MondoPlayer_Cron();
		$cron->run_autopilots();
	}

	function cron_daily() {
		require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_cron.php');
		$cron = new MondoPlayer_Cron();
		$cron->run_delete();
	}

	function process_form() {
		require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_forms.php');
		$forms = new MondoPlayer_Forms($this);
		$forms->process_form();
	}

	function page_header() {
		$plugin_data = get_plugin_data(__FILE__);
		$version_id = $plugin_data['Version'];
?>
<div style='background-color: white'>
	<div id="menu">
<div class="mondotag_menu_bar">
<div class="mondotag_menu_logo"><img src="<?php echo plugins_url("images/mondoplayer_110.png",__FILE__) ?>" alt="Mondo Player"> <span style="color: #777;font-size: 14px;vertical-align: top;padding-left: 8px;margin-top: 2px;display:inline-block">version <?php echo $version_id ?></span></div>
<div id="menu_registration" <?php
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			echo "style='display: none'";
		}
?> >
<ul id="mondotag_top_menu">
<li id="menu_item_settings" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_help_slug'">Help</li>
<li id="menu_item_notifications" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_notifications_slug'">Notifications</li>
<li id="menu_item_settings" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_settings_slug'">Settings</li>
<li id="menu_item_posts" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_posts_slug'">Posts</li>
<li id="menu_item_autopilt" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_autopilot_slug'">AutoPilot</li>
<li id="menu_item_categories" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_categories_slug'">Categories</li>
<li id="menu_item_search" class="mondotag_nav_link mondotag_nav_link_box" onclick="window.location='admin.php?page=mondoplayer_menu_slug'">Search</li>
</ul>
</div>
</div>
	</div>
<?php
	}

	function page_footer() {
?>
	<div id="busy_overlay">
		<div id="busy_content" class="popup">
		<div id="busy_spinner" style='background-image: url(<?php echo plugins_url("images/spinner.png",__FILE__) ?>)'></div>
			<div id="busy_text"></div>
		</div>
	</div>
	<div id="mondotag_overlay" onclick="overlay_click()" style='display: none'>
		<div id="message_popup" class="popup">
			<div id="mondotag_message_box"></div>
			<div id="message_ok" style='background-color: white;text-align: center'><input type='button' id="message_box_done_button" value='Ok' class="form_submit_btn_light" onclick='hide_message();' /></div>
			<div id="message_confirm" style="text-align: center;background-color: white"><input type='button' value='Ok' class="form_submit_btn_light" id="message_confirm_ok" style="display: inline-block;margin: 0 10px" /><input type='button' value='Cancel' class="form_submit_btn_light"  id="message_confirm_cancel" style="display: inline-block;margin: 0 10px" onclick="hide_message()" /><input type='button' value='Pricing' class="form_submit_btn_light"  id="message_confirm_pricing" style="display: none;margin: 0 10px" onclick="window.open('/pricing/')" /></div>
		</div>

	</div>
</div>
<?php
	}

	function menu_pages() {
		$notice_option = get_option("mondoplayer_show_notification", 0);
		$notification_count = "<span class='mondoplayer_notification_count'></span>";
		if ($notice_option > 0) {
			$notification_count = "<span class='mondoplayer_notification_count'><span class='update-plugins count-$notice_option'><span class='plugin-count'>$notice_option</span></span></span>";
		}
		add_menu_page( "MondoPlayer Settings", "MondoPlayer $notification_count", "manage_options", 'mondoplayer_menu_slug', array( $this, 'show_home_page' ), plugins_url("images/icon_20x20.png",__FILE__) );
		add_submenu_page(
			'mondoplayer_menu_slug',
			__($this->mondoplayer_plugin_name, $this->mondoplayer_plugin_name),
			'Search<span id="mondoplayer_plugin_side_menu" style="display: none"></span>',
			'manage_options',
			'mondoplayer_menu_slug',
			array( $this, 'show_home_page' )
		);

		add_submenu_page(
			'mondoplayer_menu_slug',
			__($this->mondoplayer_plugin_name, $this->mondoplayer_plugin_name),
			'Categories',
			'manage_options',
			'mondoplayer_menu_categories_slug',
			array( $this, 'show_categories_page' )
		);
		add_submenu_page(
			'mondoplayer_menu_slug',
			__($this->mondoplayer_plugin_name, $this->mondoplayer_plugin_name),
			'AutoPilot',
			'manage_options',
			'mondoplayer_menu_autopilot_slug',
			array( $this, 'show_autopilot_page' )
		);
		add_submenu_page(
			'mondoplayer_menu_slug',
			__($this->mondoplayer_plugin_name, $this->mondoplayer_plugin_name),
			'Posts',
			'edit_pages',
			'mondoplayer_menu_posts_slug',
			array( $this, 'show_post_page' )
		);
		add_submenu_page(
			'mondoplayer_menu_slug',
			__($this->mondoplayer_plugin_name, $this->mondoplayer_plugin_name),
			'Settings',
			'manage_options',
			'mondoplayer_menu_settings_slug',
			array( $this, 'show_options_page' )
		);
		add_submenu_page(
			'mondoplayer_menu_slug',
			__($this->mondoplayer_plugin_name, $this->mondoplayer_plugin_name),
			"Notifications $notification_count",
			'manage_options',
			'mondoplayer_menu_notifications_slug',
			array( $this, 'show_notifications_page' )
		);
		add_submenu_page(
			'null_menu_slug',
			"MondoPlayer Set Up Consultation",
			'Book a Call',
			'manage_options',
			'mondoplayer_menu_consultation_slug',
			array( $this, 'show_consultation_page' )
		);
		add_submenu_page(
			'null_menu_slug',
			"MondoPlayer Talk To Us",
			'Talk To Us',
			'manage_options',
			'mondoplayer_menu_tawk_slug',
			array( $this, 'show_tawk_page' )
		);
	}

	function show_home_page() {
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			$this->page_header();
			$this->mondoplayer_registration->login_page();
			$this->page_footer();
		} else {
			require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_search.php');
			$this->mondoplayer_search = new MondoPlayer_Search();
			$this->page_header();
			$this->mondoplayer_search->search_page();
			$this->page_footer();
		}
	}

	function show_categories_page() {
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			echo "<script>window.location='admin.php?page=mondoplayer_menu_slug'</script>";
			exit;
		} else {
			require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_categories.php');
			$mondoplayer_categories = new MondoPlayer_Categories();
			$this->page_header();
			$mondoplayer_categories->categories_page();
			$this->page_footer();
		}
	}

	function show_autopilot_page() {
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			echo "<script>window.location='admin.php?page=mondoplayer_menu_slug'</script>";
			exit;
		} else {
			require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_autopilot.php');
			$mondoplayer_autopilot = new MondoPlayer_Autopilot();
			$this->page_header();
			$mondoplayer_autopilot->autopilots_page();
			$this->page_footer();
		}
	}

	function show_post_page() {
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			echo "<script>window.location='admin.php?page=mondoplayer_menu_slug'</script>";
			exit;
		} else {
			require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_posts.php');
			$mondoplayer_posts = new MondoPlayer_Posts();
			$this->page_header();
			$mondoplayer_posts->posts_page();
			$this->page_footer();
		}
	}

	function show_options_page() {
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			echo "<script>window.location='admin.php?page=mondoplayer_menu_slug'</script>";
			exit;
		} else {
			require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_options.php');
			$mondoplayer_options = new MondoPlayer_Options();
			$this->page_header();
			$mondoplayer_options->options_page();
			$this->page_footer();
		}
	}

	function show_notifications_page() {
		if ($this->mondoplayer_registration->license_key === false || $this->mondoplayer_registration->license_key == "") {
			echo "<script>window.location='admin.php?page=mondoplayer_menu_slug'</script>";
			exit;
		} else {
			require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_notifications.php');
			$mondoplayer_notifications = new MondoPlayer_Notifications();
			$this->page_header();
			$mondoplayer_notifications->notifications_page();
			$this->page_footer();
		}
	}

	function show_tawk_page() {
		$this->page_header();
?>
<h1>Chat with a MondoPlayer Search Specialist</h1>
<div style="width: 100%;margin-top: 40px"><iframe width="100%" height="600" style="display:block;max-width: 400px;margin: 0 auto;border: 1px solid #ddd" src="https://tawk.to/chat/5891f3f364d4e50a6eb4b0c1/default" ></iframe>
</div>
<?php
		$this->page_footer();
	}

	function show_consultation_page() {
		$this->page_header();
		$this->show_consultation();
		$this->page_footer();
	}
	function show_consultation() {
?>
<h1>Schedule a Consultation</h1>
<div id="SOIDIV_MondoPlayerSearchSpecialist" style='margin-top: 40px; data-height="550' data-style="border: 1px solid #d8d8d8; min-width: 290px; max-width: 900px;" data-psz="00" data-so-page="MondoPlayerSearchSpecialist" ></div><script type="text/javascript" src="https://cdn.oncehub.com/mergedjs/so.js"></script>
</div>
<?php
	}

	private function get_login_key() {
		$response = wp_remote_get("https://www.mondoplayer.com/player/wp.php?plugin_id=". $this->mondoplayer_registration->license_key );
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			error_log("Error logging in to mondoplayer " . $error_message);
			return false;
		}
		if ($response['response']['code'] != 200) {
			error_log("Error logging in to mondoplayer ". $response['response']['code']);
			return false;
		}
		return wp_remote_retrieve_body($response);
	}

	public function mastermind_redirect($slug) {
		#$login_key = $this->get_login_key();
		#return "https://www.mondoplayer.com/player/wp.php?login_key=$login_key&destination=/$slug/";
	}

	public function add_category_fields ( $taxonomy ) {
?>
	<script>
		function select_before(selected) {
			if (selected == 1) {
				document.getElementById("mondoplayer_prepend_wrap").style.display = "table-row";
				document.getElementById("mondoplayer_append_wrap").style.display = "table-row";
				document.getElementById("mondoplayer_all_posts_wrap").style.display = "table-row";
			} else {
				document.getElementById("mondoplayer_prepend_wrap").style.display = "none";
				document.getElementById("mondoplayer_append_wrap").style.display = "none";
				document.getElementById("mondoplayer_all_posts_wrap").style.display = "none";
			}
		}
	</script>
		<h3>MondoPlayer Posts</h3>
		<table class='form-table'><tbody>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_hide">Hide in Main Vlog Roll</label></th>
			<td><input type='checkbox' id="mondoplayer_hide" name="mondoplayer_hide" value='1' />
			<p class="description">Check this to prevent posts in this category from showing up in your main vlog roll (your front page or /blog).</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_delete_age">Days to keep posts</label></th>
			<td><input name="mondoplayer_delete_age" id="mondoplayer_delete_age" type="text" value="" size="7">
			<p class="description">MondoPlayer objects in this category will be deleted after the number of days has passed.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_pending">Post Creation State</label></th>
			<td><select name="mondoplayer_pending" id="mondoplayer_pending" class="postform">
				<option value="-1" selected="">Draft</option>
				<option class="0" value="1">Published</option>
			</select>
			<p class="description">Posts added by MondoPlayer Autopilots to this category will be created in the given state.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_post_content">Additional Post Content</label></th>
			<td><select name="mondoplayer_post_content" id="mondoplayer_post_content" class="postform" onchange='select_before(this.value)' >
				<option value="0">Use Settings Default</option>
				<option value="1">Use Custom</option>
				<option value="2">None</option>
			</select>
			<p class="description">Use MondoPlayer's "Before" and/or "After" text.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap" id='mondoplayer_prepend_wrap' style='display: none'>
			<th scope="row"><label for="mondoplayer_prepend">Text to put before post</label></th>
			<td><textarea name="mondoplayer_prepend" id="mondoplayer_prepend" rows="5" cols="40"></textarea>
			<p class="description">Posts created by MondoPlayer with this category will have this added before the body of the post.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap" id='mondoplayer_append_wrap' style='display: none'>
			<th scope="row"><label for="mondoplayer_append">Text to put after post</label></th>
			<td><textarea name="mondoplayer_append" id="mondoplayer_append" rows="5" cols="40"></textarea>
			<p class="description">Posts created by MondoPlayer with this category will have this added before the body of the post.</p></td>
		</tr>
	</tbody>
	</table>
<?php
	}

	public function edit_category_fields ($term) {
		$term_meta = get_term_meta($term->term_id);
		#error_log("term_meta: " . json_encode($term_meta));
		if (!array_key_exists('mondoplayer_hide', $term_meta)) {
			$term_meta['mondoplayer_hide'] = array(0);
		}
		if (!array_key_exists('mondoplayer_delete_age', $term_meta)) {
			$term_meta['mondoplayer_delete_age'] = array(0);
		}
		if (!array_key_exists('mondoplayer_pending', $term_meta)) {
			$term_meta['mondoplayer_pending'] = array(-1);
		}
		if (!array_key_exists('mondoplayer_post_content', $term_meta)) {
			$term_meta['mondoplayer_post_content'] = array(0);
		}

		if (!array_key_exists('mondoplayer_append', $term_meta)) {
			$term_meta['mondoplayer_append'] = array("");
		}
		if (!array_key_exists('mondoplayer_prepend', $term_meta)) {
			$term_meta['mondoplayer_prepend'] = array("");
		}
		if (!array_key_exists('mondoplayer_all_posts', $term_meta)) {
			$term_meta['mondoplayer_all_posts'] = array(0);
		}
		$custom_display = "none";
		if ($term_meta['mondoplayer_post_content'][0] == 1) {
			$custom_display = "table-row";
		}

?>
	<script>
		function select_before(selected) {
			if (selected == 1) {
				document.getElementById("mondoplayer_prepend_wrap").style.display = "table-row";
				document.getElementById("mondoplayer_append_wrap").style.display = "table-row";
				document.getElementById("mondoplayer_all_posts_wrap").style.display = "table-row";
			} else {
				document.getElementById("mondoplayer_prepend_wrap").style.display = "none";
				document.getElementById("mondoplayer_append_wrap").style.display = "none";
				document.getElementById("mondoplayer_all_posts_wrap").style.display = "none";
			}
		}
	</script>
		<h3>MondoPlayer Posts</h3>
		<table class='form-table'><tbody>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_hide">Hide in Main Vlog Roll</label></th>
			<td><input type='checkbox' id="mondoplayer_hide" name="mondoplayer_hide" value='1' <?php if ($term_meta['mondoplayer_hide'][0] == 1) {echo 'checked';} ?> />
			<p class="description">Check this to prevent posts in this category from showing up in your main vlog roll (your front page or /blog).</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_delete_age">Days to keep posts</label></th>
			<td><input name="mondoplayer_delete_age" id="mondoplayer_delete_age" type="text" value="<?php echo $term_meta['mondoplayer_delete_age'][0] ?>" size="7">
			<p class="description">MondoPlayer objects in this category will be deleted after the number of days has passed.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_pending">Post Creation State</label></th>
			<td><select name="mondoplayer_pending" id="mondoplayer_pending" class="postform">
				<option value="-1" <?php if ($term_meta['mondoplayer_pending'][0] == -1) {echo 'selected';} ?>>Draft</option>
				<option value="1" <?php if ($term_meta['mondoplayer_pending'][0] == 1) {echo 'selected';} ?>>Published</option>
			</select>
			<p class="description">Posts added by MondoPlayer Autopilots to this category will be created in the given state.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap">
			<th scope="row"><label for="mondoplayer_post_content">Additional Post Content</label></th>
			<td><select name="mondoplayer_post_content" id="mondoplayer_post_content" class="postform" onchange='select_before(this.value)' >
				<option value="0" <?php if ($term_meta['mondoplayer_post_content'][0] == 0) {echo 'selected';} ?>>Use Settings Default</option>
				<option value="1" <?php if ($term_meta['mondoplayer_post_content'][0] == 1) {echo 'selected';} ?>>Use Custom</option>
				<option value="2" <?php if ($term_meta['mondoplayer_post_content'][0] == 2) {echo 'selected';} ?>>None</option>
			</select>
			<p class="description">Use MondoPlayer's "Before" and/or "After" text.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap" id='mondoplayer_prepend_wrap' style='display: <?php echo $custom_display ?>'>
			<th scope="row"><label for="mondoplayer_prepend">Text to put before post</label></th>
			<td> <textarea name="mondoplayer_prepend" id="mondoplayer_prepend" rows="5" cols="40"><?php echo htmlspecialchars($term_meta['mondoplayer_prepend'][0]) ?></textarea>
			<p class="description">Posts created by MondoPlayer with this category will have this added before the body of the post.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap" id='mondoplayer_append_wrap' style='display: <?php echo $custom_display ?>'>
			<th scope="row"><label for="mondoplayer_append">Text to put after post</label></th>
			<td><textarea name="mondoplayer_append" id="mondoplayer_append" rows="5" cols="40"><?php echo htmlspecialchars($term_meta['mondoplayer_append'][0]) ?></textarea>
			<p class="description">Posts created by MondoPlayer with this category will have this added before the body of the post.</p></td>
		</tr>
		<tr class="form-field form-required term-name-wrap" id='mondoplayer_all_posts_wrap' style='display: <?php echo $custom_display ?>'>
			<th scope="row"><label for="mondoplayer_all_posts">Text to put after post</label></th>
			<td><input type='checkbox' id="mondoplayer_all_posts" name="mondoplayer_all_posts" value='1' <?php if ($term_meta['mondoplayer_all_posts'][0] == 1) {echo 'checked';} ?> />
			<p class="description">Posts created by MondoPlayer with this category will have this added before the body of the post.</p></td>
		</tr>
	</tbody>
	</table>

<?php
	 }

	function register_category_meta() {
		$args = array(
			'sanitize_callback' => 'mondoplayer_category_sanitize',
			'type' => 'integer',
			'single' => true,
			'show_in_rest' => true,
		);
		register_meta('category', 'mondoplayer_hide', $args);
		register_meta('category', 'mondoplayer_delete_age', $args);
		register_meta('category', 'mondoplayer_pending', $args);
		register_meta('category', 'mondoplayer_post_content', $args);
		register_meta('category', 'mondoplayer_all_posts', $args);

		$args = array(
			'sanitize_callback' => 'mondoplayer_category_sanitize',
			'type' => 'string',
			'single' => true,
			'show_in_rest' => true,
		);

		register_meta('category', 'mondoplayer_prepend', $args);
		register_meta('category', 'mondoplayer_append', $args);
	}

	function mondoplayer_category_sanitize( $input, $setting ) {
		return $setting;
	}

	function save_meta($term_id) {
		#error_log("save_meta: " . $term_id);
		require_once(plugin_dir_path(__FILE__).'includes/class_mondoplayer_categories.php');
		$this->mondoplayer_categories = new MondoPlayer_Categories();
		$this->mondoplayer_categories->save_meta($term_id);
	}

	function stop_redirect_guess() {
		return false;
	}
	function filter_410() {
		global $wp_query;

		if ($wp_query->is_404() && (! isset($_GET['u']) || $wp_query->query_vars['name'] != "red"))  {
			$request_slug = $wp_query->query_vars['name'];
			error_log( ' - 404 for ' . $request_slug);

			if (! $request_slug) {
				return;
			}
			global $wpdb;
			$table_name = $wpdb->prefix . 'mondoplayer_deleted_posts';

			$category = $wpdb->get_var("SELECT category FROM $table_name WHERE url LIKE '" . addslashes($request_slug) . "%'");
			#error_log( ' - 404 goes to ' . $category );

			if ($category) {
				#wp_redirect($category, 410);
				header( "HTTP/1.1 410 Gone" );
				echo '<html><head><meta http-equiv="refresh" content="0;URL=' . $category . '" /></head><body></body></html>';
				exit();
			} else {
				return;
			}

		}
	}

}

$MondoPlayer = MondoPlayer::get_instance();
//new MondoPlayer();
