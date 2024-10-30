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

class MondoPlayer_Categories {
	public $table_name;
	public $license_key;
	public $screen_name;
	public $theme_check;
	public $turnkey;

	function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . "mondoplayer_autopilot";
		$this->license_key = get_option( 'mondoplayer_license_key' );
		$this->screen_name = get_option( 'screen_name' );
		$this->theme_check = wp_get_theme();
		$this->turnkey = get_option('mondoplayer_turnkey', 0);
	}

	function save_meta($term_id) {
		global $wpdb;
		$category_meta = array();
		if (isset($_POST['tag-menu-name']) ) {
			update_term_meta($term_id, "mondoplayer_menu_name", $_POST['tag-menu-name']);
		}
		if (isset($_POST['mondoplayer_hide']) && $_POST['mondoplayer_hide'] == 1) {
			update_term_meta($term_id, "mondoplayer_hide", 1 );
		} else {
			update_term_meta($term_id, "mondoplayer_hide", 0 );
		}
		$mastermind_categories = get_option('mastermind_categories', array());
		if (isset($_POST['mondoplayer_mastermind']) && $_POST['mondoplayer_mastermind'] == 1) {
			$mastermind_categories[$term_id] = 1;
			update_term_meta($term_id, "mondoplayer_mastermind", array('mastermind' => 1, 'url' => $_POST['mastermind_redirect_url'] ) );
		} else {
			unset($mastermind_categories[$term_id]);
			update_term_meta($term_id, "mondoplayer_mastermind", array('mastermind' => 0, 'url' => $_POST['mastermind_redirect_url'] ) );
		}
		update_option('mastermind_categories', $mastermind_categories);
		if (isset($_POST['mastermind_hide_slider']) ) {
			update_term_meta($term_id, "mastermind_hide_slider", $_POST['mastermind_hide_slider']);
		}
		if (isset($_POST['mastermind_hide_share']) ) {
			update_term_meta($term_id, "mastermind_hide_share", $_POST['mastermind_hide_share']);
		}
		if (isset($_POST['mastermind_hide_date']) ) {
			update_term_meta($term_id, "mastermind_hide_date", $_POST['mastermind_hide_date']);
		}
		if (isset($_POST['mastermind_hide_menu']) ) {
			update_term_meta($term_id, "mastermind_hide_menu", $_POST['mastermind_hide_menu']);
		}
		if ($this->turnkey == 1) {
			$wpdb->query("DELETE FROM " . $wpdb->prefix . "mondoplayer_slider_cache", ARRAY_N);
		}

		if (isset($_POST['mondoplayer_hide_menu']) && $_POST['mondoplayer_hide_menu'] == 1) {
			update_term_meta($term_id, "mondoplayer_hide_menu", 1 );
		} else {
			update_term_meta($term_id, "mondoplayer_hide_menu", 0 );
		}

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

		if (isset($_POST['category_top_content'])) {
			update_term_meta($term_id, "category_top_content", $_POST['category_top_content'] );
		}
		if (isset($_POST['category_rss_message'])) {
			update_term_meta($term_id, "category_rss_message", $_POST['category_rss_message'] );
		}
		if (isset($_POST['category_bottom_content'])) {
			update_term_meta($term_id, "category_bottom_content", $_POST['category_bottom_content'] );
		}
		if (isset($_POST['mondoplayer_delete_age'])) {
			update_term_meta($term_id, "mondoplayer_delete_age", intval($_POST['mondoplayer_delete_age']) );
		}
		if (isset($_POST['mondoplayer_max_words'])) {
			update_term_meta($term_id, "mondoplayer_max_words", intval($_POST['mondoplayer_max_words']) );
		}
		if (isset($_POST['mondoplayer_pending'])) {
			update_term_meta($term_id, "mondoplayer_pending", intval($_POST['mondoplayer_pending']) );
		}
		if (isset($_POST['mondoplayer_post_content'])) {
			update_term_meta($term_id, "mondoplayer_post_content", intval($_POST['mondoplayer_post_content']) );
		}
		if (isset($_POST['mondoplayer_add_links'])) {
			if ($_POST['mondoplayer_add_links'] == 1) {
				update_term_meta($term_id, "mondoplayer_add_links", 1 );
			} else {
				update_term_meta($term_id, "mondoplayer_add_links", 0 );
			}
		}
		if (isset($_POST['mondoplayer_read_more'])) {
			if ($_POST['mondoplayer_read_more'] == 1) {
				update_term_meta($term_id, "mondoplayer_read_more", 1 );
			} else {
				update_term_meta($term_id, "mondoplayer_read_more", 0 );
			}
		}
		if (isset($_POST['mondoplayer_read_more_text'])) {
			update_term_meta($term_id, "mondoplayer_read_more_text", $_POST['mondoplayer_read_more_text'] );
		}
		if (isset($_POST['mondoplayer_read_more_color'])) {
			if ($_POST['mondoplayer_read_more_color'] != "") {
				update_term_meta($term_id, "mondoplayer_read_more_color", sanitize_text_field($_POST['mondoplayer_read_more_color']) );
			} else {
				update_term_meta($term_id, "mondoplayer_read_more_color", "#5299d3" );
			}
		}
		if (isset($_POST['mondoplayer_video_thumbnail'])) {
			if ($_POST['mondoplayer_video_thumbnail'] == 1) {
				update_term_meta($term_id, "mondoplayer_video_thumbnail", 1 );
			} else {
				update_term_meta($term_id, "mondoplayer_video_thumbnail", 0 );
			}
		}
		if (isset($_POST['mondoplayer_video_above'])) {
			update_term_meta($term_id, "mondoplayer_video_above", intval($_POST['mondoplayer_video_above']) );
		}

		if ($this->theme_check->name != "MondoPlayer Theme") {
			if (isset($_POST['mondoplayer_prepend'])) {
				$prepends = json_decode(stripslashes($_POST['mondoplayer_prepend']));
				for ($i = 0; $i < sizeof($prepends); $i++) {
					$prepends[$i] = wp_kses($prepends[$i], $tags, '');
				}
				error_log("saved_prepends: " . json_encode($prepends));
				update_term_meta($term_id, 'mondoplayer_prepend', addslashes(json_encode($prepends)));
				update_term_meta($term_id, 'mondoplayer_prepend_index', 0);
			}
			if (isset($_POST['mondoplayer_append'])) {
				$appends = json_decode(stripslashes($_POST['mondoplayer_append']));
				for ($i = 0; $i < sizeof($appends); $i++) {
					$appends[$i] = wp_kses($appends[$i], $tags, '');
				}
				update_term_meta($term_id, 'mondoplayer_append', addslashes(json_encode($appends)));
				update_term_meta($term_id, 'mondoplayer_append_index', 0);
			}
		}
	}

	function categories_page() {
		wp_enqueue_media();
		wp_enqueue_editor();
		global $wpdb;
		global $wp_rewrite;

		$orderby = "name";
		if ($this->turnkey == 1) {
			$orderby = "order";
		}
		$order = "asc";
		$pagenum = 1;
		$posts_per_page = 20;
		if (isset($_GET["orderby"])) {
			$orderby = sanitize_text_field($_GET["orderby"]);
			$order = sanitize_text_field($_GET["order"]);
		};
		if (isset($_GET['pagenum']) && $_GET['pagenum'] > 1) {
			$pagenum = intval($_GET['pagenum']);
		}
		$page = "admin.php?page=mondoplayer_menu_categories_slug";

		$fields = array(
			"order"			=> array("Order", "70px"),
			"name" 			=> array("Name", ""),
			//"description" 	=> array("Description", ""),
			"slug" 			=> array("Slug", ""),
			"mastermind"	=> array("Gated", "70px"),
			"hide" 			=> array("Hide in Main Vlog Roll", "100px"),
			"hide_menu" 	=> array("Hide in Menu", "100px"),
			"days" 			=> array("Days to Keep Posts", "100px"),
			"max_words"		=> array("Max Words", ""),
			"post_status"	=> array("Post Status", "100px"),
			"autopilots" 	=> array("Autopilots", ""),
			"count" 		=> array("Post Count", "70px")
		);
		$has_mastermind = 0;
		$category_id = 0;
		$tag_name = "";
		$tag_slug = "";
		$tag_parent = -1;
		$tag_description = "";
		$mondoplayer_hide = "";
		$mondoplayer_hide_message = "none";
		$mondoplayer_hide_menu = "";
		$mondoplayer_delete_age = get_option('mondoplayer_delete_age', '90');
		$mondoplayer_max_words = get_option('mondoplayer_max_words', '150');
		$mondoplayer_pending = 1;
		$mondoplayer_post_content = 0;
		$mondoplayer_add_links = "checked";
		$mondoplayer_read_more = "checked";
		$mondoplayer_read_more_color = "#000";
		$mondoplayer_read_more_text = "Watch/Read More";
		$mondoplayer_video_thumbnail = "checked";
		$mondoplayer_video_above = 0;
		$toggle_above = "0px";
		$mondoplayer_mastermind = 0;
		$mastermind_hide_slider = 0;
		$mastermind_hide_share = 0;
		$mastermind_hide_date = 0;
		$mastermind_hide_menu = 0;
		$toggle_mastermind = "0px";
		$mastermind_hide_slider_wrap = "none";
		$toggle_hide_slider = "0px";
		$toggle_hide_share = "0px";
		$toggle_hide_date = "0px";
		$mastermind_redirect_url = get_site_url();
		$mondoplayer_prepend = "";
		$mondoplayer_append = "";
		$show_add_category = "block";
		$new_category_wrapper = "none";
		$custom_display = "none";
		$add_links_display = "block";
		$category_submit_button = "Add Category";
		$category_delete_button = "none";
		$category_urls_wrap = "none";
		$category_url = "";
		$feed_url = "";
		$rss_message = "🎥 Link in Profile for Video";
		$category_title = "Categories";
		$category_top_content = "";
		$category_bottom_content = "";

		if (isset($_GET['sort_direction'])) {
			$orderby = "order";
			$order = "asc";
			$direction = intval($_GET['sort_direction']);
			$cur_term = intval($_GET['sort_category']);
			$category_array = array();
			$category_list = array();
			$results = $wpdb->get_results("SELECT term_id, meta_value FROM {$wpdb->prefix}termmeta WHERE meta_key ='mondoplayer_menu_sort'");
			$max_value = 0;
			foreach ($results as $sort_item) {
				$cur_order = $sort_item->meta_value;
				if ($cur_term == $sort_item->term_id) {
					$cur_order = $cur_order + ($direction * 1.5);
				}

				$category_array[] = $sort_item->term_id;
				$category_list[] = array('term_id'=>$sort_item->term_id, 'order'=>$cur_order);
				if ($sort_item->meta_value > 0) {
					$max_value = $sort_item->meta_value;
				}
			}
			$categories = get_categories( array(
				'orderby' => "name",
				'order' => "asc",
				'hide_empty' => false,
			));
			foreach ($categories as $category) {
				if (in_array($category->term_id, $category_array)) {
					continue;
				}
				$max_value++;
				$cur_order = $max_value;
				if ($cur_term == $category->term_id) {
					$cur_order = $cur_order + ($direction * 1.5);
				}
				$category_list[] = array('term_id'=>$category->term_id, 'order'=>$cur_order);
			}

			usort($category_list, function ($a, $b) {
				if ($a['order'] == $b['order']) {
					return 0;
				}
				return ($a['order'] < $b['order']) ? -1 : 1;
			});

			for ($i = 0; $i < sizeof($category_list); $i++) {
				update_term_meta($category_list[$i]['term_id'], "mondoplayer_menu_sort", $i);
			}
		}

		if (isset($_GET['edit'])) {
			$show_add_category = "none";
			$new_category_wrapper = "block";
			$category_urls_wrap = "table";
			$category_submit_button = "Save Category";
			$category_delete_button = "inline-block";
			$category_title = "Category Edit";
			$category_id = intval($_GET['edit']);
			$category = get_category($category_id);
			$tag_name = $category->name;
			$tag_menu_name = $category->name;
			$tag_slug = $category->slug;
			$tag_parent = $category->parent;
			$tag_description = $category->description;
			$category_url = get_category_link($category_id);
			$feed_url = get_category_feed_link($category_id, 'rss2');

			$category_meta = get_term_meta($category_id, '', true);
			#error_log("category_meta: " . json_encode($category_meta));

			if (isset($category_meta['mondoplayer_hide'][0]) && $category_meta['mondoplayer_hide'][0] == "1") {
				$mondoplayer_hide = "checked";
				$mondoplayer_hide_message = "block";
			} else {
				$mondoplayer_hide = "";
			}
			if (isset($category_meta['mondoplayer_hide_menu'][0]) && $category_meta['mondoplayer_hide_menu'][0] == "1") {
				$mondoplayer_hide_menu = "checked";
			} else {
				$mondoplayer_hide_menu = "";
			}
			if (isset($category_meta['mondoplayer_menu_name'][0])) {
				$tag_menu_name = $category_meta['mondoplayer_menu_name'][0];
			}
			if (isset($category_meta['category_top_content'][0])) {
				$category_top_content = $category_meta['category_top_content'][0];
			}
			if (isset($category_meta['category_rss_message'][0])) {
				$rss_message = $category_meta['category_rss_message'][0];
			}
			if (isset($category_meta['category_bottom_content'][0])) {
				$category_bottom_content = $category_meta['category_bottom_content'][0];
			}
			if (isset($category_meta['mondoplayer_delete_age'][0])) {
				$mondoplayer_delete_age = $category_meta['mondoplayer_delete_age'][0];
				if ($mondoplayer_delete_age == 0) {
					$mondoplayer_delete_age = "n/a";
				}
			}
			if (isset($category_meta['mondoplayer_max_words'][0])) {
				$mondoplayer_max_words = $category_meta['mondoplayer_max_words'][0];
			}
			if (isset($category_meta['mondoplayer_pending'][0])) {
				$mondoplayer_pending = $category_meta['mondoplayer_pending'][0];
			}
			if (isset($category_meta['mondoplayer_post_content'][0])) {
				$mondoplayer_post_content = $category_meta['mondoplayer_post_content'][0];
			}
			if (isset($category_meta['mondoplayer_add_links'][0]) && $category_meta['mondoplayer_add_links'][0] == "0") {
				$mondoplayer_add_links = "";
				$add_links_display = "none";
			}
			if (isset($category_meta['mondoplayer_read_more'][0]) && $category_meta['mondoplayer_read_more'][0] == "") {
				$mondoplayer_read_more = "";
			} else {
				$mondoplayer_read_more = "checked";
			}
			if (isset($category_meta['mondoplayer_read_more_text'][0]) && $category_meta['mondoplayer_read_more_text'][0] != "") {
				$mondoplayer_read_more_text = $category_meta['mondoplayer_read_more_text'][0];
			}

			if (isset($category_meta['mondoplayer_read_more_color'][0]) && $category_meta['mondoplayer_read_more_color'][0] != "") {
				$mondoplayer_read_more_color = $category_meta['mondoplayer_read_more_color'][0];
			}
			if (isset($category_meta['mondoplayer_video_thumbnail'][0]) && $category_meta['mondoplayer_video_thumbnail'][0] == "1") {
				$mondoplayer_video_thumbnail = "checked";
			} else {
				$mondoplayer_video_thumbnail = "";
			}
			if (isset($category_meta['mondoplayer_video_above'][0])) {
				$mondoplayer_video_above = $category_meta['mondoplayer_video_above'][0];
				if ($category_meta['mondoplayer_video_above'][0] == 1) {
					$toggle_above = "18px";
				}
			} else {
				$toggle_above = "0px";
			}
			if (isset($category_meta['mondoplayer_mastermind'][0])) {
				$test = unserialize($category_meta['mondoplayer_mastermind'][0]);
				$mondoplayer_mastermind = $test['mastermind'];
				$mastermind_redirect_url = $test['url'];
				if ($mondoplayer_mastermind == 1) {
					$toggle_mastermind = "18px";
					$mastermind_hide_slider_wrap = "table-row";
				}
			} else {
				$toggle_mastermind = "0px";
			}
			if (isset($category_meta['mastermind_hide_slider'][0]) && $category_meta['mastermind_hide_slider'][0] == 1) {
				$mastermind_hide_slider = 1;
				$toggle_hide_slider = "18px";
			}
			if (isset($category_meta['mastermind_hide_share'][0]) && $category_meta['mastermind_hide_share'][0] == 1) {
				$mastermind_hide_share = 1;
				$toggle_hide_share = "18px";
			}
			if (isset($category_meta['mastermind_hide_date'][0]) && $category_meta['mastermind_hide_date'][0] == 1) {
				$mastermind_hide_date = 1;
				$toggle_hide_date = "18px";
			}
			if (isset($category_meta['mastermind_hide_menu'][0]) && $category_meta['mastermind_hide_menu'][0] == 1) {
				$mastermind_hide_menu = 1;
				$toggle_hide_menu = "18px";
			}

			if (isset($category_meta['mondoplayer_prepend'][0])) {
				$mondoplayer_prepend = $category_meta['mondoplayer_prepend'][0];
				error_log("mondoplayer_prepend: " . $mondoplayer_prepend);
			}
			if (isset($category_meta['mondoplayer_append'][0])) {
				$mondoplayer_append = $category_meta['mondoplayer_append'][0];
			}
			if ($mondoplayer_post_content == "1") {
				$custom_display = "block";
			}
		}
		$mastermind_categories = get_option('mastermind_categories', array());

		if (sizeof($mastermind_categories) > 0) {
			$has_mastermind = 1;
		}
		$autopilots = $wpdb->get_results("SELECT autopilot_id, title, categories FROM $this->table_name");

		$categories_autopilots = new stdClass();

		foreach($autopilots as $autopilot) {
			if ($autopilot->categories == "") {
				continue;
			}
			$cur_categories = json_decode($autopilot->categories);
			for ($i = 0; $i < count($cur_categories); $i++) {
				if (isset($categories_autopilots->{$cur_categories[$i]->term_id})) {
					$categories_autopilots->{$cur_categories[$i]->term_id} .= ", ";
				} else {
					$categories_autopilots->{$cur_categories[$i]->term_id} = "";
				}
				$categories_autopilots->{$cur_categories[$i]->term_id} .= "<a href='admin.php?page=mondoplayer_menu_autopilot_slug&edit=$autopilot->autopilot_id'>$autopilot->title</a>";
			}
		}

		$menu_url = admin_url("nav-menus.php");
?>
<style>
#wpcontent {
	background-color: white;
}
.tablenav-pages a {
    display: inline-block;
    min-width: 17px;
    border: 1px solid #ccc;
    padding: 3px 5px 7px;
    background: #e5e5e5;
    font-size: 16px;
    line-height: 1;
    font-weight: 400;
	text-align: center;
}
.mce-tinymce {
	clear: both;
	margin-bottom: 12px;
}
.order_arrow {
	cursor: pointer;
	transition: all .05s;
}
.order_arrow:hover {
	color: #999;
}
.abridged_feed {
	display: none;
}
#abridged_button {
	color: white;
	background-color: #141414;
	padding: 4px 12px;
	font-size: 16px;
	cursor: pointer;
	transition: all 0.25s;
	text-align: center;
}
#abridged_button:hover {
	background-color: #999;
}
</style>
<script>
var edit_category_id = <?php echo $category_id ?>;
var prepends = new Array();
var appends = new Array();
window.addEventListener('load', (event) => {
	if (edit_category_id > 0) {
		if (document.getElementById("mondoplayer_prepend").value == "0" || document.getElementById("mondoplayer_prepend").value == "null") {
			prepends[0] = "";
		} else {
			try {
				prepends = JSON.parse(document.getElementById("mondoplayer_prepend").value);
				if (prepends === null) {
					prepends = new Array();
					prepends[0] = document.getElementById("mondoplayer_prepend").value;
				} else if (prepends.length == 0) {
					prepends[0] = "";
				}
			}
			catch(e) {
				console.log("prepend error: " + e.message);
				prepends[0] = document.getElementById("mondoplayer_prepend").value;
			}
		}
		if (document.getElementById("mondoplayer_append").value == "0" || document.getElementById("mondoplayer_append").value == "null") {
			appends[0] = "";
		} else {
			try {
				appends = JSON.parse(document.getElementById("mondoplayer_append").value);
				if (appends === null) {
					appends = new Array();
					appends[0] = document.getElementById("mondoplayer_append").value;
				} else if (appends.length == 0) {
					appends[0] = "";
				}
			}
			catch(e) {
				appends[0] = document.getElementById("mondoplayer_append").value;
			}
		}
		draw_prepends();
	}
});

var editors_to_initialize = new Array();
function draw_prepends() {
	editors_to_initialize = new Array();
	document.getElementById("prepends").innerHTMl = "";
	if (prepends.length == 0) {
		var div = document.createElement("div");
		div.id = "mondoplayer_prepend_" + 0 + "-editor-tools";
		div.class = "wp-editor-tools hide-if-no-js";
		div.innerHTML = '<div id="wp-mondoplayer_prepend_' + 0 + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_prepend_' + 0 + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_prepend_' + 0 + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_prepend_' + 0 + '">Visual</button><button type="button" id="mondoplayer_prepend_' + 0 + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_prepend_' + 0 + '">Text</button></div>';
		document.getElementById("prepends").appendChild(div);

		var textarea = document.createElement("textarea");
		textarea.id = "mondoplayer_prepend_" + 0;
		textarea.name = "mondoplayer_prepend_" +0;
		textarea.value = "";
		document.getElementById("prepends").appendChild(textarea);
		editors_to_initialize.push("mondoplayer_prepend_" + 0);
	} else {
		for (var i = 0; i < prepends.length; i++) {
			var div = document.createElement("div");
			div.id = "mondoplayer_prepend_" + i + "-editor-tools";
			div.class = "wp-editor-tools hide-if-no-js";
			div.innerHTML = '<div id="wp-mondoplayer_prepend_' + i + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_prepend_' + i + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_prepend_' + i + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_prepend_' + i + '">Visual</button><button type="button" id="mondoplayer_prepend_' + i + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_prepend_' + i + '">Text</button></div>';
			document.getElementById("prepends").appendChild(div);

			var textarea = document.createElement("textarea");
			textarea.id = "mondoplayer_prepend_" + i;
			textarea.name = "mondoplayer_prepend_" + i;
			textarea.value = prepends[i];
			document.getElementById("prepends").appendChild(textarea);
			editors_to_initialize.push("mondoplayer_prepend_" + i);
		}
	}
	document.getElementById("appends").innerHTMl = "";
	if (appends.length == 0) {
		var div = document.createElement("div");
		div.id = "mondoplayer_append_" + 0 + "-editor-tools";
		div.class = "wp-editor-tools hide-if-no-js";
		div.innerHTML = '<div id="wp-mondoplayer_append_' + 0 + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_append_' + 0 + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_append_' + 0 + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_append_' + 0 + '">Visual</button><button type="button" id="mondoplayer_append_' + 0 + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_append_' + 0 + '">Text</button></div>'
		document.getElementById("appends").appendChild(div);

		var textarea = document.createElement("textarea");
		textarea.id = "mondoplayer_append_" + 0;
		textarea.name = "mondoplayer_append_" + 0;
		textarea.value = "";
		document.getElementById("appends").appendChild(textarea);
		editors_to_initialize.push("mondoplayer_append_" + 0);
	} else {
		for (var i = 0; i < appends.length; i++) {
			var div = document.createElement("div");
			div.id = "mondoplayer_append_" + i + "-editor-tools";
			div.class = "wp-editor-tools hide-if-no-js";
			div.innerHTML = '<div id="wp-mondoplayer_append_' + i + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_append_' + i + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_append_' + i + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_append_' + i + '">Visual</button><button type="button" id="mondoplayer_append_' + i + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_append_' + i + '">Text</button></div>'
			document.getElementById("appends").appendChild(div);

			var textarea = document.createElement("textarea");
			textarea.id = "mondoplayer_append_" + i;
			textarea.name = "mondoplayer_append_" + i;
			textarea.value = appends[i];
			document.getElementById("appends").appendChild(textarea);
			editors_to_initialize.push("mondoplayer_append_" + i);
		}
	}
	setTimeout("initialize_prepends()", 0);
}
function initialize_prepends() {
	var tinymce = {
		tinymce: {
			wpautop: false ,
			mediaButtons: true,
			plugins: 'charmap colorpicker hr lists paste tabfocus textcolor fullscreen wordpress wpautoresize wpeditimage wpemoji wpgallery wplink wpdialogs wptextpattern wpview image' ,
			toolbar1: 'styleselect fontsizeselect | fullscreen | alignleft aligncenter alignright | link media table | wp_adv' ,
			toolbar2: 'bold italic forecolor backcolor underline strikethrough | outdent indent | bullist numlist advlist | charmap hr removeformat | wp_more wp_help wpview' ,
			external_plugins: {
				'media': '/wp-content/plugins/mondoplayer/js/media/plugin.js',
				'table': '/wp-content/plugins/mondoplayer/js/table/plugin.min.js',
				'advlist': '/wp-content/plugins/mondoplayer/js/advlist/plugin.min.js',
				'imagetools': '/wp-content/plugins/mondoplayer/js/imagetools/plugin.min.js',
			},
			toolbar3: '' ,
			toolbar4: '' ,
			//body_class: 'id post-type-post-status-publish post-format-standard' ,
			wpeditimage_disable_captions: false ,
			wpeditimage_html5_captions: true,
		},
		Quicktags: true,
		mediaButtons: true,
		editor_height: 200,
	};
	for (var i = 0; i < editors_to_initialize.length; i++) {
		document.getElementById(editors_to_initialize[i]).style.display = "block";
		document.getElementById(editors_to_initialize[i]).style.width = "100%";
		wp.editor.initialize (editors_to_initialize[i], tinymce );
	}
	editors_to_initialize = new Array();
}

function shuffle(location) {
	event.stopPropagation();
	if (location == 0) {
		if (wp.editor.getContent("mondoplayer_prepend_" + (prepends.length - 1)).trim() == "") {
			return;
		}
		var div = document.createElement("div");
		div.id = "mondoplayer_prepend_" + prepends.length + "-editor-tools";
		div.class = "wp-editor-tools hide-if-no-js";
		div.innerHTML = '<div id="wp-mondoplayer_prepend_' + prepends.length + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_prepend_' + prepends.length + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_prepend_' + prepends.length + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_prepend_' + prepends.length + '">Visual</button><button type="button" id="mondoplayer_prepend_' + prepends.length + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_prepend_' + prepends.length + '">Text</button></div>'
		document.getElementById("prepends").appendChild(div);

		var textarea = document.createElement("textarea");
		textarea.id = "mondoplayer_prepend_" + prepends.length;
		textarea.name = "mondoplayer_prepend_" + prepends.length;
		textarea.value = "";
		textarea.style.display = "none";
		document.getElementById("prepends").appendChild(textarea);
		editors_to_initialize.push("mondoplayer_prepend_" + prepends.length);
		prepends[prepends.length] = "";
	}
	if (location == 1) {
		if (wp.editor.getContent("mondoplayer_append_" + (appends.length - 1)).trim() == "") {
			return;
		}
		var div = document.createElement("div");
		div.id = "mondoplayer_append_" + appends.length + "-editor-tools";
		div.class = "wp-editor-tools hide-if-no-js";
		div.innerHTML = '<div id="wp-mondoplayer_append_' + appends.length + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_append_' + appends.length + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_append_' + appends.length + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_append_' + appends.length + '">Visual</button><button type="button" id="mondoplayer_append_' + appends.length + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_append_' + appends.length + '">Text</button></div>'
			document.getElementById("appends").appendChild(div);

		var textarea = document.createElement("textarea");
		textarea.id = "mondoplayer_append_" + appends.length;
		textarea.name = "mondoplayer_append_" + appends.length;
		textarea.value = "";
		textarea.style.display = "none";
		document.getElementById("appends").appendChild(textarea);
		editors_to_initialize.push("mondoplayer_append_" + appends.length);
		appends[appends.length] = "";
	}
	setTimeout("initialize_prepends()", 0);
	return;
}

var license_key = "<?php echo addslashes($this->license_key) ?>";
var screen_name = "<?php echo addslashes($this->screen_name) ?>";
var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';
var edit_category_id = <?php echo $category_id ?>;

function show_add_category(show) {
	window.scrollTo(0,0);
	if (show) {
		document.getElementById("categories_title").innerHTML = "Category Edit";
		document.getElementById("show_add_category").style.display = "none";
		document.getElementById("mondoplayer_categories_table").style.display = "none";
		document.getElementById("new_category_wrapper").style.display = "block";
		clear_category();
	} else {
		document.getElementById("categories_title").innerHTML = "Categories";
		document.getElementById("show_add_category").style.display = "block";
		document.getElementById("mondoplayer_categories_table").style.display = "block";
		document.getElementById("new_category_wrapper").style.display = "none";
	}
}

function clear_category() {
	document.getElementById("new_category_id").value = 0;
	document.getElementById("tag-name").value = "";
	document.getElementById("tag-menu-name").value = "";
	document.getElementById("slug").value = "";
	document.getElementById("category_blog_url").innerHTML = "";
	document.getElementById("category_rss_feed").innerHTML = "";
	document.getElementById("tag-parent").value = "-1";
	document.getElementById("tag-description").value = "";
	document.getElementById("mondoplayer_hide").checked = false;
	document.getElementById("mondoplayer_hide_message").style.display = "none";
	document.getElementById("mondoplayer_hide_menu").checked = false;
	document.getElementById("mondoplayer_delete_age").value = "90";
	document.getElementById("mondoplayer_max_words").value = "150";
	document.getElementById("mondoplayer_pending").value = "1";
	document.getElementById("mondoplayer_post_content").value = "0";

	select_before(0);
}

function select_before(selected) {
	if (selected == 1) {
		document.getElementById("prepend_wrap").style.display = "block";
	} else {
		document.getElementById("prepend_wrap").style.display = "none";
	}
}
function add_links_toggle() {
	if (document.getElementById("mondoplayer_add_links").checked) {
		document.getElementById("add_links_wrap").style.display = "block";
	} else {
		document.getElementById("add_links_wrap").style.display = "none";
	}
}
function toggle_above() {
	if (document.getElementById("mondoplayer_video_above").value == 1) {
		document.getElementById("mondoplayer_video_above").value = 0;
		document.getElementById("mondoplayer_video_above_toggle").style.left = "0px";
	}else {
		document.getElementById("mondoplayer_video_above").value = 1;
		document.getElementById("mondoplayer_video_above_toggle").style.left = "18px";
	}
}
function toggle_hide() {
	if (document.getElementById("mondoplayer_hide").checked) {
		document.getElementById("mondoplayer_hide_message").style.display = "block";
	} else {
		document.getElementById("mondoplayer_hide_message").style.display = "none";
	}
}
function toggle_mastermind() {
	if (document.getElementById("mondoplayer_mastermind").value == 1) {
		document.getElementById("mondoplayer_mastermind").value = 0;
		document.getElementById("mondoplayer_mastermind_toggle").style.left = "0px";
		document.getElementById("mastermind_redirect_url_wrap").style.display = "none";
		document.getElementById("mastermind_hide_menu_wrap").style.display = "none";
	} else {
		document.getElementById("mondoplayer_mastermind").value = 1;
		document.getElementById("mondoplayer_mastermind_toggle").style.left = "18px";
		document.getElementById("mastermind_redirect_url_wrap").style.display = "table-row";
		document.getElementById("mastermind_hide_menu_wrap").style.display = "table-row";
	}
}
function toggle_hide_slider() {
	if (document.getElementById("mastermind_hide_slider").value == 1) {
		document.getElementById("mastermind_hide_slider").value = 0;
		document.getElementById("mastermind_hide_slider_toggle").style.left = "0px";
	} else {
		document.getElementById("mastermind_hide_slider").value = 1;
		document.getElementById("mastermind_hide_slider_toggle").style.left = "18px";
	}
}
function toggle_hide_share() {
	if (document.getElementById("mastermind_hide_share").value == 1) {
		document.getElementById("mastermind_hide_share").value = 0;
		document.getElementById("mastermind_hide_share_toggle").style.left = "0px";
	} else {
		document.getElementById("mastermind_hide_share").value = 1;
		document.getElementById("mastermind_hide_share_toggle").style.left = "18px";
	}
}
function toggle_hide_date() {
	if (document.getElementById("mastermind_hide_date").value == 1) {
		document.getElementById("mastermind_hide_date").value = 0;
		document.getElementById("mastermind_hide_date_toggle").style.left = "0px";
	} else {
		document.getElementById("mastermind_hide_date").value = 1;
		document.getElementById("mastermind_hide_date_toggle").style.left = "18px";
	}
}
function toggle_hide_menu() {
	if (document.getElementById("mastermind_hide_menu").value == 1) {
		document.getElementById("mastermind_hide_menu").value = 0;
		document.getElementById("mastermind_hide_menu_toggle").style.left = "0px";
	} else {
		document.getElementById("mastermind_hide_menu").value = 1;
		document.getElementById("mastermind_hide_menu_toggle").style.left = "18px";
	}
}
function create_prepend() {
	tinyMCE.triggerSave();
	var prepend_combined = new Array();
	var append_combined = new Array();
	var textareas = document.getElementsByTagName("textarea");
	for( var i = 0; i < textareas.length; i++) {
		if (textareas[i].id.indexOf("mondoplayer_prepend_") > -1 && textareas[i].value.trim() != "") {
			prepend_combined.push(textareas[i].value);
		}
		if (textareas[i].id.indexOf("mondoplayer_append_") > -1 && textareas[i].value.trim() != "") {
			append_combined.push(textareas[i].value);
		}
	}

	document.getElementById("mondoplayer_prepend").value = JSON.stringify(prepend_combined);
	document.getElementById("mondoplayer_append").value = JSON.stringify(append_combined);
	}

function toggle_delete() {
	if (document.getElementById('keep_forever').checked) {
		document.getElementById('mondoplayer_delete_age').value = "n/a";
		document.getElementById('mondoplayer_delete_age').readOnly = true;
	} else {
		document.getElementById('mondoplayer_delete_age').value = 90;
		document.getElementById('mondoplayer_delete_age').readOnly = false;
	}
}

function menu_sort(direction, category) {
	window.location = "/wp-admin/admin.php?page=mondoplayer_menu_categories_slug&sort_direction=" + direction + "&sort_category=" + category;
}
function toggle_abridged() {
	var rows = document.querySelectorAll(".abridged_feed");
	if (rows[0].style.display != "table-row") {
		for (var i = 0; i < rows.length; i++) {
			rows[i].style.display = "table-row"
		}
	} else {
		for (var i = 0; i < rows.length; i++) {
			rows[i].style.display = "none"
		}
	}
}
</script>
	<div id="categories_page" style='margin-right: 8px'>
		<h1 id='categories_title'><?php echo $category_title ?></h1>
			<input type="button" id="show_add_category" class="form_submit_btn_light" value="Add New Category" onclick="show_add_category(true)" style='margin: 0;display: <?php echo $show_add_category ?>'/>
			<div id='new_category_wrapper' class="right_sub_page right_panel_form" style='display: <?php echo $new_category_wrapper ?>'>
				<form id="addtag" method="post" class="form" onsubmit="create_prepend()" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" id="new_category_id" name="new_category_id" value="<?php echo $category_id ?>">
				<input type="hidden" name="action" value="mondoplayer">
				<input type="hidden" name="form" value="save_category">

<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Name</td><td class='content_column' style='vertical-align: middle'><input name="tag-name" id="tag-name" type="text" value="<?php echo $tag_name ?>" size="40" aria-required="true"><img class='Explainer-Video-Icon' src='<?php echo  plugin_dir_url( __DIR__ ).'images/Explainer-Video-Icon.png'; ?>' onclick='go_to_mastermind("https://vlog.mondoplayer.com/category-edit/")' style="margin-left: 36px" /><br /><div class='category_description'>Category Name and Description will display on your Vlog.</div></td></tr>
	<tr><td class='label_column'>Menu Name</td><td class='content_column' style='vertical-align: middle'><input name="tag-menu-name" id="tag-menu-name" type="text" value="<?php echo $tag_menu_name ?>" size="40" aria-required="true"><br /><div class='category_description'>Category Name to be displayed in Menus.</div></td></tr>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Slug</td><td class='content_column' style='vertical-align: middle'><input name="slug" id="slug" type="text" value="<?php echo $tag_slug ?>" size="40" ><div class='category_description'>The name is how it appears on your site.</div></td></tr>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Parent Category</td><td class='content_column' style='vertical-align: middle'><select name="tag-parent" id="tag-parent" class="postform" style='width: initial'><option value="-1" <?php if ($tag_parent == -1) { echo "selected"; } ?>>None</option><option class="level-0" value="1" <?php if ($tag_parent == 1) { echo "selected"; } ?>>Uncategorized</option></select><div class='category_description'>Categories can have a hierarchy. You might have a Jazz category, and under that have children categories for Bebop and Big Band. Totally optional.</div></td></tr>
<?php
		if ($this->theme_check->name == "MondoPlayer Theme") {
			$tinymce = array(
				'tinymce' => array (
					'wpautop' => false ,
					'mediaButtons' => true,
					'plugins' => 'charmap colorpicker hr lists paste tabfocus textcolor fullscreen wordpress wpautoresize wpeditimage wpemoji wpgallery wplink wpdialogs wptextpattern wpview image',
					'toolbar1' => 'styleselect fontsizeselect fullscreen alignleft aligncenter alignright link media table wp_adv' ,
					'toolbar2' => 'bold italic forecolor backcolor underline strikethrough outdent indent bullist numlist advlist charmap hr removeformat wp_more wp_help wpview' ,
					#'external_plugins' => array(
					#	'media' => '/wp-content/plugins/mondoplayer/js/media/plugin.js',
					#	'table' => '/wp-content/plugins/mondoplayer/js/table/plugin.min.js',
					#	'advlist' => '/wp-content/plugins/mondoplayer/js/advlist/plugin.min.js',
					#	'imagetools' => '/wp-content/plugins/mondoplayer/js/imagetools/plugin.min.js',
					#),
					'external_plugins' => '{"media": "/wp-content/plugins/mondoplayer/js/media/plugin.js","table":"/wp-content/plugins/mondoplayer/js/table/plugin.min.js","advlist":"/wp-content/plugins/mondoplayer/js/advlist/plugin.min.js","imagetools":"/wp-content/plugins/mondoplayer/js/imagetools/plugin.min.js"}',
					'wpeditimage_disable_captions' => false ,
					'wpeditimage_html5_captions' => true,
				),
				'Quicktags' => true,
				'mediaButtons' => true,
				'editor_height' => 200,
			);
?>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Content to put at top of Category pages</td><td class='content_column' style='vertical-align: middle'><?php wp_editor($category_top_content, "category_top_content", $tinymce); ?></td></tr>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Content to put at bottom of Category pages</td><td class='content_column' style='vertical-align: middle'><?php wp_editor($category_bottom_content, "category_bottom_content", $tinymce); ?></td></tr>
<?php
	}
?>
	<tr><td class='label_column'>Description</td><td class='content_column' style='vertical-align: middle'><textarea name="tag-description" id="tag-description" rows="5" style='width: 100%;max-width: 640px;'><?php echo $tag_description ?></textarea></td></tr>
	<tr><td class='label_column'>Hide in Main Vlog Roll</td><td class='content_column' style='vertical-align: middle'><input type='checkbox' id='mondoplayer_hide' name='mondoplayer_hide' value="1" <?php echo $mondoplayer_hide ?> onclick='toggle_hide()' /><div class='category_description'>Check this to prevent posts in this Category from displaying in your main vlog roll (your front page).<p id='mondoplayer_hide_message' style='color: red;display: <?php echo $mondoplayer_hide_message ?>'>WARNING: Posts for this category will not appear in the main vlog roll. Search engines will not be able to find these posts if the <a href='<?php echo $category_url ?>' target="_blank">Category Vlog Roll</a> is not linked to a <a href='<?php echo $menu_url ?>'>Menu</a>.</p></div></td></tr>
	<tr><td class='label_column'>Hide in Menu</td><td class='content_column' style='vertical-align: middle'><input type='checkbox' id='mondoplayer_hide_menu' name='mondoplayer_hide_menu' value="1" <?php echo $mondoplayer_hide_menu ?> onclick='toggle_hide_menu()' /><div class='category_description'>Check this to prevent this Category from displaying in your menu.<p id='mondoplayer_hide_menu_message' style='color: red;'></p></div></td></tr>
	<tr><td class='label_column'>Days to Keep Posts</td><td class='content_column' style='vertical-align: middle'><input type='text' id='mondoplayer_delete_age' name='mondoplayer_delete_age' style='width: initial' value='<?php echo $mondoplayer_delete_age ?>' <?php if ($mondoplayer_delete_age == "n/a") { echo "readonly"; } ?> /> <span class="category_description">(Never delete these posts <input type="checkbox" id="keep_forever" onclick="toggle_delete();" <?php if ($mondoplayer_delete_age < 1) { echo "checked"; } ?> />)</span> <div class='category_description'>Posts created for this Category will be automatically deleted after the number of days indicated.</div></td></tr>
	<tr><td class='label_column'>Maximum Words in Post</td><td class='content_column' style='vertical-align: middle'><input type='text' id='mondoplayer_max_words' name='mondoplayer_max_words' style='width: initial' value='<?php echo $mondoplayer_max_words ?>'  /><div class='category_description'>&nbsp;</div></td></tr>
	<tr><td class='label_column'>Post Status</td><td class='content_column' style='vertical-align: middle'><select name="mondoplayer_pending" id="mondoplayer_pending" class="postform" style='width: initial' onchange="if(this.value==2) {document.getElementById('trusted_domains_panel').style.display='block'}else{document.getElementById('trusted_domains_panel').style.display='none'}"><option value="-1" <?php if ($mondoplayer_pending == -1) { echo "selected"; } ?>>Draft</option><option class="0" value="2" <?php if ($mondoplayer_pending == 2) { echo "selected"; } ?>>Draft/Publish Trusted</option><option class="0" value="1" <?php if ($mondoplayer_pending == 1) { echo "selected"; } ?>>Publish</option></select><div class='category_description'>Posts added by Autopilots will either be held in Draft (to be previewed and approved under Posts) or automatically Published.</div>
<div id='trusted_domains_panel' <?php if ($mondoplayer_pending != 2) { echo "style='display: none;'"; } ?>>
<div><input type="text" class="form_field_input" id="options_trusted_domain" value="" placeholder="Add a trusted source (domain or Youtube user/channel)" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;max-width: 570px;padding: 10px 16px">&nbsp;<input type="button" value="+" class="page_button" style="height: 38px;width: 38px;margin: 0;display: inline-block" onclick="options_add_trusted(document.getElementById('options_trusted_domain').value)"></div>
<div id='options_trusted_domain_list' class='easy_search_domains'></div>
</div>
</td></tr>
	<tr><td class='label_column'>Add Links to Original Video</td><td class='content_column' style='vertical-align: middle'><input type='checkbox' id='mondoplayer_add_links' name='mondoplayer_add_links' value="1" onclick='add_links_toggle()' <?php echo $mondoplayer_add_links ?> /><div class='category_description'></div></td></tr>
</table>
<div id="add_links_wrap" style='display: <?php echo $add_links_display ?>'>
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'style='border: 0'>"<?php echo $mondoplayer_read_more_text; ?>" Button</td><td class='content_column' style='vertical-align: middle;border: 0'><input type='checkbox' id='mondoplayer_read_more' name='mondoplayer_read_more' value="1" <?php echo $mondoplayer_read_more ?> /><div class='category_description'></div></td></tr>
	<tr><td class='label_column'style='border: 0'>"<?php echo $mondoplayer_read_more_text; ?>" Button Color</td><td class='content_column' style='vertical-align: middle;border: 0'><input type='color' id='mondoplayer_read_more_color' name='mondoplayer_read_more_color' style='width: 75px' value="<?php echo $mondoplayer_read_more_color ?>" /><div class='category_description'></div></td></tr>
	<tr><td class='label_column'style='border: 0'>"<?php echo $mondoplayer_read_more_text; ?>" Button Text</td><td class='content_column' style='vertical-align: middle;border: 0'><input type='text' id='mondoplayer_read_more_text' name='mondoplayer_read_more_text' style='width: initial' value="<?php echo $mondoplayer_read_more_text ?>" /><div class='category_description'></div></td></tr>
	<tr style='display:none'><td class='label_column'style='border: 0'>Thumbnail of Video</td><td class='content_column' style='vertical-align: middle;border: 0'><input type='checkbox' id='mondoplayer_video_thumbnail' name='mondoplayer_video_thumbnail' value="1" <?php echo $mondoplayer_video_thumbnail ?> /><div class='category_description'></div></td></tr>
	<tr><td class='label_column'style='border: 0'>Above or Below Post</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'>Above <div class="toggle_outside" onclick="toggle_above()" ><div class="toggle_inside" id="mondoplayer_video_above_toggle" style="left: <?php echo $toggle_above ?>"></div></div> Below<input type='hidden' id='mondoplayer_video_above' name='mondoplayer_video_above' value='<?php echo $mondoplayer_video_above ?>'<div class='category_description'></div></td></tr>
	</table>
</div>
<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Add Text and Graphics to Post</td><td class='content_column' style='vertical-align: middle'><select name="mondoplayer_post_content" id="mondoplayer_post_content" class="postform" onchange="select_before(this.value)">
	<option value="0" <?php if ($mondoplayer_post_content == 0) { echo "selected"; } ?>>Default from Settings Screen</option>
	<option value="1" <?php if ($mondoplayer_post_content == 1) { echo "selected"; } ?>>Custom Content for this Category</option>
	<option value="2" <?php if ($mondoplayer_post_content == 2) { echo "selected"; } ?>>None</option>
</select><div class='category_description'>Add custom text and graphics to posts made for this Category.</div></td></tr>
</table>

<div id='prepend_wrap' style='display: <?php echo $custom_display ?>'>
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Text/Graphics BEFORE Post</td><td class='content_column' style='vertical-align: middle'><input type="hidden" id="mondoplayer_prepend" name="mondoplayer_prepend" value="<?php echo htmlentities($mondoplayer_prepend); ?>" /><div id="prepends"></div>
	<p style='text-align:right' ><input type="button" value="Shuffle" onclick="shuffle(0);" /></p></td></tr>
	<tr><td class='label_column'>Text/Graphics AFTER Post</td><td class='content_column' style='vertical-align: middle'><input type="hidden" id="mondoplayer_append" name="mondoplayer_append" value="<?php echo htmlentities($mondoplayer_append); ?>" /><div id="appends"></div>
	<p style='text-align:right' ><input type="button" value="Shuffle" onclick="shuffle(1);" /></p></td></tr>
</table>
</div>

<?php
		if ($this->turnkey == 1) {
?>

<table id='mastermind_wrap' style='width: 100%;margin-top:4px;display: block' cellspacing='0' cellpadding='0'>
<tr id='mastermind_hide_slider_wrap' ><td class='label_column' style='border: 0'>Hide Player in Category Vlog Roll</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'>No <div class="toggle_outside" onclick="toggle_hide_slider()" ><div class="toggle_inside" id="mastermind_hide_slider_toggle" style="left: <?php echo $toggle_hide_slider ?>"></div></div> Yes<input type='hidden' id='mastermind_hide_slider' name='mastermind_hide_slider' value='<?php echo $mastermind_hide_slider ?>'<div class='category_description'></div></td></tr>
<tr id='mastermind_hide_share_wrap'><td class='label_column' style='border: 0'>Hide Share Buttons</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'>No <div class="toggle_outside" onclick="toggle_hide_share()" ><div class="toggle_inside" id="mastermind_hide_share_toggle" style="left: <?php echo $toggle_hide_share ?>"></div></div> Yes<input type='hidden' id='mastermind_hide_share' name='mastermind_hide_share' value='<?php echo $mastermind_hide_share ?>'<div class='category_description'></div></td></tr>
<tr id='mastermind_hide_date_wrap'><td class='label_column' style='border: 0'>Hide Post Date</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'>No <div class="toggle_outside" onclick="toggle_hide_date()" ><div class="toggle_inside" id="mastermind_hide_date_toggle" style="left: <?php echo $toggle_hide_date ?>"></div></div> Yes<input type='hidden' id='mastermind_hide_date' name='mastermind_hide_date' value='<?php echo $mastermind_hide_date ?>'<div class='category_description'></div></td></tr>
</table>
<table id='mastermind_wrap' style='width: 100%;margin-top:4px;display: block' cellspacing='0' cellpadding='0'>
<tr><td class='label_column' style='border: 0'>Gated</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'>No <div class="toggle_outside" onclick="toggle_mastermind()" ><div class="toggle_inside" id="mondoplayer_mastermind_toggle" style="left: <?php echo $toggle_mastermind ?>"></div></div> Yes<input type='hidden' id='mondoplayer_mastermind' name='mondoplayer_mastermind' value='<?php echo $mondoplayer_mastermind ?>'<div class='category_description'></div></td></tr>
<tr id='mastermind_hide_menu_wrap'  style='display: <?php echo $mastermind_hide_slider_wrap ?>'><td class='label_column' style='border: 0'>Hide Menu Bar</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'>No <div class="toggle_outside" onclick="toggle_hide_menu()" ><div class="toggle_inside" id="mastermind_hide_menu_toggle" style="left: <?php echo $toggle_hide_menu ?>"></div></div> Yes<input type='hidden' id='mastermind_hide_menu' name='mastermind_hide_menu' value='<?php echo $mastermind_hide_menu; ?>' /><div class='category_description'></div></td></tr>
<tr id='mastermind_redirect_url_wrap' style='display: <?php echo $mastermind_hide_slider_wrap ?>'><td class='label_column' style='border: 0'>Redirect Non-Users to</td><td class='content_column' style='vertical-align: middle;color: #777;border: 0'><input type='url' id='mastermind_redirect_url' name='mastermind_redirect_url' size="40"  value='<?php echo $mastermind_redirect_url ?>'<div class='category_description'></div></td></tr>
</table>
<?php
		}
?>
<table id='category_urls_wrap' style='width: 100%;margin-top:4px;display: <?php echo $category_urls_wrap ?>' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column' style='border: 0'>Category Vlog Roll</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_blog_url'><a href='<?php echo $category_url ?>' target="_blank"><?php echo $category_url ?></a></div><p>Use this URL to add add this Category to a Menu or Link on your site</p></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Category RSS Feed</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>' target="_blank"><?php echo $feed_url ?></a></div><p>Use this RSS Feed to automatically post (without hashtags) to social media with tools like dlvr.it </p><span id='autopilot_category_message'></span></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Category RSS Feed with Prepend Text</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?rss_message' target="_blank"><?php echo $feed_url ?>?rss_message</a></div><div style='margin-top: 10px'><input type='text' style='width: 500px' placeholder='Enter text to include at top of posts' id='category_rss_message' value='<?php echo $rss_message ?>' name='category_rss_message' /></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Instagram</p></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Category RSS Feed with Hashtags in Description</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?hashtags_with_description' target="_blank"><?php echo $feed_url ?>?hashtags_with_description</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it  on services like Pinterest</p></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Category RSS Feed with Hashtags</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?hashtags' target="_blank"><?php echo $feed_url ?>?hashtags</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Facebook, LinkedIn and Twitter</p><span id='autopilot_hashtag_message'></span></div></td></tr>
	<tr><td style='border: 0' colspan='2'><div id='abridged_button' onclick='toggle_abridged();'>Abridged RSS Feeds</div></td></tr>
	<tr class='abridged_feed'><td class='label_column' colspan="2" style="border: 0;padding: 24px 8px;text-align: center">These feeds only contain the 2 most popular posts from the past day.</td></tr>
	<tr class='abridged_feed'><td class='label_column' >Category RSS Feed</td><td class='content_column' style='vertical-align: middle;'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?abridged' target="_blank"><?php echo $feed_url ?>?abridged</a></div><p>Use this RSS Feed to automatically post (without hashtags) to social media with tools like dlvr.it </p><span id='autopilot_category_message'></span></div></td></tr>
	<tr class='abridged_feed'><td class='label_column' style='border: 0'>Category RSS Feed with Prepend Text</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?rss_message&abridged' target="_blank"><?php echo $feed_url ?>?rss_message&abridged</a></div><div style='margin-top: 10px'></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Instagram</p></div></td></tr>
	<tr class='abridged_feed'><td class='label_column' style='border: 0'>Category RSS Feed with Hashtags in Description</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?hashtags_with_description&abridged' target="_blank"><?php echo $feed_url ?>?hashtags_with_description&abridged</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it  on services like Pinterest</p></div></td></tr>
	<tr class='abridged_feed'><td class='label_column' style='border: 0'>Category RSS Feed with Hashtags</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo $feed_url ?>?hashtags&abridged' target="_blank"><?php echo $feed_url ?>?hashtags&abridged</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Facebook, LinkedIn and Twitter</p></div></td></tr>
</table>

<p class="submit_buttons"><input type="submit" name="submit" id="category_submit" class="form_submit_btn_light" style='margin: 0;display: inline-block' value="<?php echo $category_submit_button ?>"> <input type="button" name="delete" id="category_delete" class="form_submit_btn_light" style='margin: 0;display: <?php echo $category_delete_button ?>' value="Delete" onclick='delete_category()'> <input type='button' value='Cancel' class='form_submit_btn_light' class='blue' style='margin: 0;display: inline-block' onclick='show_add_category(false)' /></p></form>

			</div>
<div id='mondoplayer_categories_table' style='display: <?php echo $show_add_category ?>'>
<?php
		$categories = get_categories( array(
			'orderby' => "name",
			'order' => $order,
			'hide_empty' => false,
		));

		if ($orderby == "order") {
			if ($order == "asc") {
				usort($categories, function ($a, $b) {
					if (get_term_meta($a->term_id, "mondoplayer_menu_sort", true) == get_term_meta($b->term_id, "mondoplayer_menu_sort", true)) {
						return 0;
					}
					return (get_term_meta($a->term_id, "mondoplayer_menu_sort", true) < get_term_meta($b->term_id, "mondoplayer_menu_sort", true)) ? -1 : 1;
				});
			} else {
				usort($categories, function ($a, $b) {
					if (get_term_meta($a->term_id, "mondoplayer_menu_sort", true) == get_term_meta($b->term_id, "mondoplayer_menu_sort", true)) {
						return 0;
					}
					return (get_term_meta($a->term_id, "mondoplayer_menu_sort", true) > get_term_meta($b->term_id, "mondoplayer_menu_sort", true)) ? -1 : 1;
				});
			}
		}

		$page_count = ceil(count($categories)/$posts_per_page);

		$pagination_string = "";
		if ($page_count > 1) {
			$pagination_string = '<div class="tablenav"><div class="tablenav-top tablenav-pages"><span class="displaying-num">' . count($categories) . ' items</span><span class="pagination-links">';
			if ($pagenum > 2) {
				$pagination_string .= "<a class='first-page' href='$page&amp;orderby=$orderby&amp;order=$order&amp;pagenum=1'><span class='screen-reader-text'>First page</span><span class='' aria-hidden='true'>«</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>First page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>«</span>";
			}
			if ($pagenum > 1) {
				$pagination_string .= "<a class='prev-page' href='$page&amp;orderby=$orderby&amp;order=$order&amp;pagenum=" . ($pagenum - 1) . "'><span class='screen-reader-text'>Previous page</span><span class='' aria-hidden='true'>‹</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>Previous page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>‹</span>";
			}
			$pagination_string .= "<span class='paging-input'><label for='current-page-selector' class='screen-reader-text'>Current Page</label><input class='current-page' id='current-page-selector' type='text' name='paged' value='$pagenum' size='1' aria-describedby='table-paging' style='height: 28px'> of <span class='total-pages'>$page_count</span></span>";
			if ($pagenum < $page_count) {
				$pagination_string .= "<a class='next-page' href='$page&amp;orderby=$orderby&amp;order=$order&amp;pagenum=" . ($pagenum + 1) . "'><span class='screen-reader-text'>Next page</span><span class='' aria-hidden='true'>›</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>Next page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>›</span>";
			}
			if ($pagenum < $page_count - 1 ) {
				$pagination_string .= "<a class='last-page' href='$page&amp;orderby=$orderby&amp;order=$order&amp;pagenum=$page_count'><span class='screen-reader-text'>Last page</span><span class='' aria-hidden='true'>»</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>Last page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>»</span>";
			}

			$pagination_string .= "</span></div></div>";
		}

		echo $pagination_string;
?>
		<table class="wp-list-table widefat fixed striped tags" >
	<thead>
	<tr>
<?php
		foreach ($fields as $field => $field_array) {
			if ($has_mastermind == 0 && $field == "mastermind") {
				continue;
			}
			if ($this->turnkey != 1 && $field == "order") {
				continue;
			}
			$width = "";
			if ($field_array[1] !== "") {
				$width ="style='width: $field_array[1]'";
			}
			if ($field == "order" || $field == "name") {
				if ($field == $orderby) {
					$next_order = "desc";
					if ($order == "desc") {
						$next_order = "asc";
					}
					echo "<th scope='col' id='$field' class='manage-column column-name column-primary sorted $order' $width><a href='$page&amp;orderby=$field&amp;order=$next_order'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a></th>";
				} else {
					echo "<th scope='col' id='$field' class='manage-column column-name column-primary sortable desc' $width><a href='$page&amp;orderby=$field&amp;order=asc'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a></th>";
				}
			} else {
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary' $width><span>" . $field_array[0] . "</th>";
			}
		}
?>
</tr>
	</thead>
	<tbody id="the-list" data-wp-lists="list:tag">
<?php

$start = $posts_per_page * ($pagenum - 1);
for ($c = $start; $c < ($start + $posts_per_page); $c++) {
	if (!isset($categories[$c])) {
		break;
	}
	$category = $categories[$c];
	$class = "";
	$category = get_object_vars($category);
	if ($category['term_id'] == 1) {
		continue;
	}
	$category_meta = get_term_meta($category['term_id'], '', true);
	$category['mastermind'] = "No";

	if (isset($category_meta['mondoplayer_mastermind'][0])) {
		$test = unserialize($category_meta['mondoplayer_mastermind'][0]);
		if ($test['mastermind'] == 1) {
			$category['mastermind'] = "Yes";
		}
	}

	$category['order'] = "0";
	if (isset($category_meta['mondoplayer_menu_sort'][0]) && $category_meta['mondoplayer_menu_sort'][0] != "") {
		$category['order'] = $category_meta['mondoplayer_menu_sort'][0];
	}

	$category['hide'] = "No";
	if (isset($category_meta['mondoplayer_hide'][0]) && $category_meta['mondoplayer_hide'][0] == 1) {
		$category['hide'] = "Yes";
	}
	$category['hide_menu'] = "No";
	if (isset($category_meta['mondoplayer_hide_menu'][0]) && $category_meta['mondoplayer_hide_menu'][0] == 1) {
		$category['hide_menu'] = "Yes";
	}
	if ($category['description'] == "") {
		$category['description'] = "--";
	}

	$category['days'] = get_option('mondoplayer_delete_age', 90);
	if (isset($category_meta['mondoplayer_delete_age'][0])) {
		$category['days'] = $category_meta['mondoplayer_delete_age'][0];
	}
	$category['max_words'] = get_option("mondoplayer_max_words", 150);
	if (isset($category_meta['mondoplayer_max_words'][0])) {
		$category['max_words'] = $category_meta['mondoplayer_max_words'][0];
	}
	$category['manage'] = "No";
	if (isset($category_meta['mondoplayer_manage'][0]) && $category_meta['mondoplayer_manage'][0] == true) {
		$category['manage'] = "Yes";
	}
	$category['autopilots'] = "--";
	if (isset($categories_autopilots->{$category['term_id']})) {
		$category['autopilots'] = $categories_autopilots->{$category['term_id']};
	}
	$category['post_status'] = "Draft";
	if (isset($category_meta['mondoplayer_pending'][0])) {
		if ($category_meta['mondoplayer_pending'][0] == 1) {
			$category['post_status'] = "Publish";
		} else if ($category_meta['mondoplayer_pending'][0] == 2) {
			$category['post_status'] = "Publish Trusted";
		} else {
			$category['post_status'] = "Draft";
		}
	}
	$category['view'] = "<a href='" . get_category_link($category['term_id']) . "' target='_blank' style='display:block;width: 150px;text-overflow: ellipsis;white-space: nowrap;overflow: hidden'>" . get_category_link($category['term_id']) . "</a>";
	$category['rss'] = "<a href='" . get_category_feed_link($category['term_id']) . "' target='_blank' style='display:block;width: 150px;text-overflow: ellipsis;white-space: nowrap;overflow: hidden'>" . get_category_feed_link($category['term_id']) . "</a>";
	$category['name'] = "<a class='row-title' href='$page&edit=" . $category['term_id'] . "'>" . $category['name'] . "</a>";

	echo "<tr id='tag-" . $category['term_id']. "' style='display: table-row;'>";

	foreach ($fields as $field => $field_array) {
		if ($has_mastermind == 0 && $field == "mastermind") {
			continue;
		}
		if ($this->turnkey != 1 && $field == "order") {
			continue;
		}

		if ($field == "order") {
			echo "<td class='' data-colname='$field'><span class='order_arrow' onclick='menu_sort(-1," . $category['term_id'] . ")'>▲</span><span class='order_arrow' onclick='menu_sort(1," . $category['term_id'] . ")'>▼</span></td>";
			continue;
		}

		$class = "";
		if ($field == "name") {
			$class = "column-primary";
		}
		echo "<td class='$class' data-colname='$field'>" . $category[$field] . "</td>";
	}
	echo "</tr>";

}
?></tbody>
	<tfoot>
	<tr>
<?php 
		foreach ($fields as $field => $field_array) {
			if ($field == $orderby) {
				$next_order = "desc";
				if ($order == "desc") {
					$next_order = "asc";
				}
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sorted $order'><a href='$page&amp;orderby=$field&amp;order=$next_order'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a></th>";
			} else {
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sortable desc'><a href='$page&amp;orderby=$field&amp;order=asc'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a></th>";
			}
		}
?>
</tr>
	</tfoot>

</table>
<?php
echo $pagination_string;
?>
</div>

	</div>
<?php
	}

	function category_sort($a, $b) {
 	   if ($a['order'] == $b['order']) {
    	    return 0;
    	}
    	return ($a['order'] < $b['order']) ? -1 : 1;
	}
}

