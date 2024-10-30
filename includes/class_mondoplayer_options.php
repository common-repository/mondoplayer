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

class MondoPlayer_Options {
	public $license_key;
	public $theme_check;
	function __construct() {
		global $wpdb;
		$this->license_key = get_option( 'mondoplayer_license_key' );
		$this->theme_check = wp_get_theme();
	}

	function options_page() {
		wp_enqueue_media();
		wp_enqueue_editor();
		$mondoplayer_prepend = get_option('mondoplayer_prepend', '');
		$mondoplayer_append = get_option('mondoplayer_append', '');
		$mondoplayer_max_words = get_option('mondoplayer_max_words', '150');
		if ($mondoplayer_max_words == 0) {
			$mondoplayer_max_words = "";
		}
		$mondoplayer_delete_age = get_option('mondoplayer_delete_age', 90);
		$uses_hashtags = 0;
		$mondoplayer_rss_message = get_option('mondoplayer_rss_message', "🎥 Link in Profile for Video");

?>
<script>
var prepends = new Array();
var appends = new Array();
window.addEventListener('load', (event) => {
	update_options(true);
	state.options.excluded_meta_tags = '<?php echo get_option("mondoplayer_exclude_meta_tags", ""); ?>';
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
			console.log("prepend error: " + JSON.stringify(e));
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

	<?php if ($this->theme_check->name != "MondoPlayer Theme") { echo "draw_prepends();";} ?>
	options_draw_excluded_search_terms();
	options_draw_excluded_meta_tags();
	options_draw_excluded_youtube();
});

var editors_to_initialize = new Array();
function draw_prepends() {
	editors_to_initialize = new Array();
	document.getElementById("prepends").innerHTMl = "";
	for (var i = 0; i < prepends.length; i++) {
		var div = document.createElement("div");
		div.id = "mondoplayer_prepend_" + i + "-editor-tools";
		div.class = "wp-editor-tools hide-if-no-js";
		div.innerHTML = '<div id="wp-mondoplayer_prepend_' + i + '-media-buttons" class="wp-media-buttons"><button type="button" id="insert-media-button" class="button insert-media add_media" data-editor="mondoplayer_prepend_' + i + '"><span class="wp-media-buttons-icon"></span> Add Media</button></div><div class="wp-editor-tabs"><button type="button" id="mondoplayer_prepend_' + i + '-tmce" class="wp-switch-editor switch-tmce" data-wp-editor-id="mondoplayer_prepend_' + i + '">Visual</button><button type="button" id="mondoplayer_prepend_' + i + '-html" class="wp-switch-editor switch-html" data-wp-editor-id="mondoplayer_prepend_' + i + '">Text</button></div>'
		document.getElementById("prepends").appendChild(div);

		var textarea = document.createElement("textarea");
		textarea.id = "mondoplayer_prepend_" + i;
		textarea.name = "mondoplayer_prepend_" + i;
		textarea.value = prepends[i];
		document.getElementById("prepends").appendChild(textarea);
		editors_to_initialize.push("mondoplayer_prepend_" + i);
	}
	document.getElementById("appends").innerHTMl = "";
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
	setTimeout("initialize_prepends()", 0);
}
function initialize_prepends() {
	var tinymce = {
		tinymce: {
			wpautop: false ,
			mediaButtons: true,
			plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview,image' ,
			toolbar1: 'formatselect, bold, italic, bullist, numlist, blockquote, alignleft, aligncenter, alignright, link,  wp_more, fullscreen, spellchecker, wp_adv' ,
			toolbar2: 'wpview, strikethrough, hr, forecolor,  pastetext, removeformat, charmap, outdent, indent, undo, redo, wp_help' ,
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


var license_key = "<?php echo addslashes($this->license_key) ?>";
var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';
var ignore_original_tags = <?php echo get_option("ignore_original_tags", 0); ?>
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
.label_column {
	width: 400px;
}
.right_panel_form td {
	padding-top: 12px;
	padding-bottom: 12px;
}
.mce-tinymce {
	clear: both;
	margin-bottom: 12px;
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
<div id="options_page" class="right_sub_page right_panel_form">
	<h1>Account Setup</h1>

<form class="form" id="options_form" onsubmit="return false;">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Default Text to Put Before Post</td><td class='content_column' style='vertical-align: middle'><input type="hidden" id="mondoplayer_prepend" name="mondoplayer_prepend" value="<?php echo htmlentities($mondoplayer_prepend); ?>" /><div id="prepends"></div>
	<p style='text-align:right' ><button onclick="shuffle(0)">Shuffle</button></p>
	</td></tr>
	<tr <?php if ($this->theme_check->name == "MondoPlayer Theme") { echo "style='display:none'";} ?>><td class='label_column'>Default Text to Put After Post</td><td class='content_column' style='vertical-align: middle'><input type="hidden" id="mondoplayer_append" name="mondoplayer_append" value="<?php echo htmlentities($mondoplayer_append); ?>" /><div id="appends"></div>
	<p style='text-align:right' ><button onclick="shuffle(1)">Shuffle</button></p>
	</td></tr>
	<tr><td class='label_column'>Only Post Videos with Thumbnails</td><td class='content_column' style='vertical-align: middle'><input type="checkbox" class="form_field_checkbox_input" id="onlyPostVideosWithThumbnails" value="on" style="margin-right: 520px"> <img class='Explainer-Video-Icon' src='<?php echo  plugin_dir_url( __DIR__ ).'images/Explainer-Video-Icon.png'; ?>' onclick='go_to_mastermind("https://vlog.mondoplayer.com/settings/")' style='margin-left: 36px;' /></td></tr>
	<tr><td class='label_column'>Days to Keep Posts</td><td class='content_column' style='vertical-align: middle'><input type='text' id='mondoplayer_delete_age' name='mondoplayer_delete_age' style='width: initial' value='<?php echo $mondoplayer_delete_age ?>'  /><div class='category_description'>Posts created by MondoPlayer for this Category will be automatically deleted after the number of days indicated.</div></td></tr>
	<tr><td class='label_column'>Default Maximum Words in Post</td><td class='content_column' style='vertical-align: middle'><input type="text" id="mondoplayer_max_words" name='mondoplayer_max_words' style='width: initial'  value='<?php echo $mondoplayer_max_words ?>' /><div class='category_description'>(leave blank to not trim posts)</div></td></tr>
	<tr><td class='label_column'>Domains to be Excluded From All Searches</td><td class='content_column'><table style='width: 100%;max-width: 640px' cellspacing='0' cellpadding='0'><tr><td><input type="text" class="form_field_input" id="options_domain" value="" placeholder="Add a domain name" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px;max-width: 640px"></td><td style='width: 38px'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;margin: 0;display: inline-block" onclick="options_add_exclude(document.getElementById('options_domain').value)"></td></tr></table><div id="options_domain_list"  class='easy_search_domains'></div></td></tr>
	<tr><td class='label_column'>Trusted Sources</td><td class='content_column'><table style='width: 100%;max-width: 640px' cellspacing='0' cellpadding='0'><tr><td><input type="text" class="form_field_input" id="options_trusted_domain" value="" placeholder="Add a trusted source (domain or Youtube user/channel)" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px;max-width: 640px"></td><td style='width: 38px'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;margin: 0;display: inline-block" onclick="options_add_trusted(document.getElementById('options_trusted_domain').value)"></td></tr></table><div id="options_trusted_domain_list"  class='easy_search_domains'></div></td></tr>
	<tr><td class='label_column'>Exclude Videos with these Words</td><td class='content_column'><table style='width: 100%;max-width: 640px' cellspacing='0' cellpadding='0'><tr><td><input type="text" class="form_field_input" id="options_exclude_search_terms" value="" placeholder="Add a search term" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px;max-width: 640px"></td><td style='width: 38px'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;margin: 0;display: inline-block" onclick="options_add_exclude_search_term(document.getElementById('options_exclude_search_terms').value)"></td></tr></table><div id="options_exclude_search_terms_list"  class='easy_search_domains'></div></td></tr>
	<tr><td class='label_column'>Exclude these YouTube Channels from all Results</td><td class='content_column'><table style='width: 100%;max-width: 640px' cellspacing='0' cellpadding='0'><tr><td><input type="text" class="form_field_input" id="options_exclude_youtube" value="" placeholder="Exclude a Youtube Channel ID" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px;max-width: 640px"></td><td style='width: 38px'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;margin: 0;display: inline-block" onclick="options_add_exclude_youtube(document.getElementById('options_exclude_youtube').value)"></td></tr></table><div id="options_exclude_youtube_list"  class='easy_search_domains'></div></td></tr>
	</table>

	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Content Settings</td><td class='content_column' style='color: #777'><p style='font-size: 16px'>MondoPlayer already blocks most offensive videos.</p><p style='font-size: 16px'>Only use this feature if you don't want videos that even mentions these subjects. Please note this may limit the quantity of videos you receive.</p>   <table cellpadding="6" style="width: 150px;background-color: white"><tr><td style='padding: 4px'>Gore</td><td style='padding: 4px'><input type='checkbox' id='content_filter_gore' /></td></tr><tr><td style='padding: 4px'>Profanity</td><td style='padding: 4px'><input type='checkbox' id='content_filter_profanity' /></td></tr><tr><td style='padding: 4px'>Religion</td><td style='padding: 4px'><input type='checkbox' id='content_filter_religion' /></td></tr><tr><td style='padding: 4px'>Sex</td><td style='padding: 4px'><input type='checkbox' id='content_filter_sex' /></td></tr><tr><td style='padding: 4px'>Violence</td><td style='padding: 4px'><input type='checkbox' id='content_filter_violence' /></td></tr></table><p style='font-size: 16px'>* We try our best to make sure all the videos you curate are appropriate, but there is no 100% guaranty.<p> </td></tr>
	<tr><td class='label_column'>Don't Copy Metatags from Source Video</td><td class='content_column' style='vertical-align: middle'><input type="checkbox" class="form_field_checkbox_input" id="ignore_original_tags" value="on" /></td></tr>
	<tr><td class='label_column'>Exclude these Metatags from Posts</td><td class='content_column'><table style='width: 100%;max-width: 640px' cellspacing='0' cellpadding='0'><tr><td><input type="text" class="form_field_input" id="options_exclude_meta_tags" value="" placeholder="Add a search term" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px;max-width: 640px"></td><td style='width: 38px'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;margin: 0;display: inline-block" onclick="options_add_exclude_meta_tags(document.getElementById('options_exclude_meta_tags').value)"></td></tr></table><div id="options_exclude_meta_tags_list"  class='easy_search_domains'></div></td></tr>
	<tr style='display: none'><td class='label_column'>Play Videos Over Wi-Fi Only.</td><td class='content_column' style='vertical-align: middle'><input type="checkbox" class="form_field_checkbox_input" id="playOnlyDuringWifi" value="on" ></td></tr>
	<tr style='display: none'><td class='label_column'>Do Not Play Videos When My Phone is Roaming.</td><td class='content_column' style='vertical-align: middle'><input type="checkbox" class="form_field_checkbox_input" id="playDuringRoaming" value="on" ></td></tr>
	<tr style='display: none'><td class='label_column'>Allow MondoPlayer to send Push Notifications which may include Alerts, Sounds and Icon Badges.  These can be configured in the Options screen.</td><td class='content_column' style='vertical-align: middle'><input type="checkbox" class="form_field_checkbox_input" id="notification" value="on" ></td></tr>
	<tr><td class='label_column'>Allow MondoTag.com Inc. to send me emails about MondoPlayer.  You can withdraw your consent at any time in the Options screen.</td><td class='content_column'><input type="checkbox" class="form_field_checkbox_input" id="emailFlag" value="on" ></td></tr>
	<tr><td class='label_column'>Change your Email Address</td><td class='content_column'><input type="button" class="form_submit_btn_light" value="Change" onclick="open_change_email()" style="width: 100px;margin:0" /></td></tr>
	<tr><td class='label_column'>Submit a website for us to  check for video</td><td class='content_column'><input type="button" class="form_submit_btn_light" value="Submit" onclick="open_submit_website()" style="width: 100px;margin:0" /></td></tr>
	<tr><td class='label_column'>Clear Search History</td><td class='content_column'><input type="button" class="form_submit_btn_light" value="Clear" onclick="clear_history()" style="width: 100px;margin:0" /></td></tr>
	<tr><td class='label_column'>Site RSS Feed</td><td class='content_column' style='vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>' target="_blank"><?php echo get_feed_link('') ?></a></div><p>Use this RSS Feed to automatically post (without hashtags) to social media with tools like dlvr.it</p><span id='autopilot_category_message'></span></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Site RSS Feed with Prepend Text</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?rss_message' target="_blank"><?php echo get_feed_link('') ?>?rss_message</a></div><div style='margin-top: 10px'><input type='text' style='width: 500px' placeholder='Enter text to include at top of posts' id='mondoplayer_rss_message' value='<?php echo $mondoplayer_rss_message ?>' name='mondoplayer_rss_message' /></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Instagram</p></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Site RSS Feed with Hashtags in Description</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?hashtags_with_description' target="_blank"><?php echo get_feed_link('') ?>?hashtags_with_description</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it  on services like Pinterest</p></div></td></tr>
	<tr><td class='label_column' style='border: 0'>Site RSS Feed with Hashtags</td><td class='content_column' style='vertical-align: middle;border: 0'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?hashtags' target="_blank"><?php echo get_feed_link('') ?>?hashtags</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Facebook, LinkedIn and Twitter</p><span id='autopilot_hashtag_message'></span></div></td></tr>
	<tr><td style='border: 0;padding:0' colspan='2'><div id='abridged_button' onclick='toggle_abridged();'>Abridged RSS Feeds</div></td></tr>
	<tr class='abridged_feed'><td class='label_column' colspan="2" style="border: 0;padding: 24px 8px;text-align: center">These feeds only contain the 2 most popular posts from the past day.</td></tr>
	<tr class='abridged_feed'><td class='label_column' >Site RSS Feed</td><td class='content_column' style='vertical-align: middle;'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?abridged' target="_blank"><?php echo get_feed_link('') ?>?abridged</a></div><p>Use this RSS Feed to automatically post (without hashtags) to social media with tools like dlvr.it </p><span id='autopilot_category_message'></span></div></td></tr>
	<tr class='abridged_feed'><td class='label_column' style='border: 0'>Site RSS Feed with Prepend Text</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?rss_message&abridged' target="_blank"><?php echo get_feed_link('') ?>?rss_message&abridged</a></div><div style='margin-top: 10px'></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Instagram</p></div></td></tr>
	<tr class='abridged_feed'><td class='label_column' style='border: 0'>Site RSS Feed with Hashtags in Description</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?hashtags_with_description&abridged' target="_blank"><?php echo get_feed_link('') ?>?hashtags_with_description&abridged</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it  on services like Pinterest</p></div></td></tr>
	<tr class='abridged_feed'><td class='label_column' style='border: 0'>Site RSS Feed with Hashtags</td><td class='content_column' style='border: 0;vertical-align: middle'><div class='category_description'><div style='display: inline-block;' id='category_rss_feed'><a href='<?php echo get_feed_link('') ?>?hashtags&abridged' target="_blank"><?php echo get_feed_link('') ?>?hashtags&abridged</a></div><p>Use this RSS Feed to automatically post to social media with tools like dlvr.it on services like Facebook, LinkedIn and Twitter</p></div></td></tr>
</table>
<div class="form_submit_btn-wrapper"><input type="button" class="form_submit_btn_light" value="Save" onclick="save_options()" style="margin: 0 10px;width: 200px" /><div id="options_error" class="form_field_error" style="margin-top: 10px"></div>
</div></form>
</div>

<?php
	}
}

