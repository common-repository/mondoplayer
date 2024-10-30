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

class MondoPlayer_Search {
	public $license_key;
	public $screen_name;
	function __construct() {
		$this->license_key = get_option( 'mondoplayer_license_key' );
		$this->screen_name = get_option( 'mondoplayer_screen_name' );
	}

	function search_page() {
	$categories = get_categories( array(
		'orderby' => 'name',
		'order' => 'asc',
		'hide_empty' => false,
	));

	$category_string = "[";
	foreach ( $categories as $category ) {
		$category_string .= "{'name':'" . $category->name. "','term_id':" . $category->term_id. "},";
	}
	$category_string .= "]";

		$users = get_users( array(
		'orderby' => 'nicename',
		'order' => 'asc',
		'hide_empty' => false,
	));
	$user_string = "[";
	foreach ( $users as $user ) {
		if ($user->display_name == "mondoplayer") {
			continue;
		}
		$user_string .= "{'name':'" . $user->display_name . "','user_id':" . $user->ID . "},";
	}
	$user_string .= "]";

	$can_post = "true";
	$is_subscribed = get_option('mondoplayer_is_subscribed');
	if ($is_subscribed == 0) {
		$min_date = date('Y-m-d', strtotime("-7 days"));
		$posts_array = array(
			'meta_key' => 'mondoplayer_object',
			'date_query' => array(
			'before' => $min_date,
			)
		);

		$post_query = new WP_Query($posts_array);
		if ($post_query->found_posts > 0) {
			$can_post = "false";
		}
	}

?>
<style>
#wpcontent {
	background-color: white;
}
</style>
	<script>
		var license_key = '<?php echo $this->license_key ?>';
		var screen_name = '<?php echo $this->screen_name ?>';
		var category_list = <?php echo $category_string ?>;
		var user_list = <?php echo $user_string ?>;
		var image_url = "<?php echo plugins_url('../images/',__FILE__) ?>";
		var can_post = <?php echo $can_post ?>;
		var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';
	</script>
	<div id="search_page">
		<div style="display: flex;flex-flow: row wrap-reverse;justify-content: flex-start;">
			<div id="right_panel" style='margin-left: 0px;max-width: 1230px;flex-grow: 4;flex-shrink: 1'>

				<div id="right_panel_search_page" style='font-size: 16px'>
				<div id="right_panel_search_entry" class="right_panel_search_entry" style='display: none'><input type="text" id="search_entry" placeholder="Search for video" ><input type='button' id='easy_search_save_button' class='page_button' value='Save Search' onclick='save_search_open(false)' style='display: inline-block;width: auto' />&nbsp;&nbsp;<input type='button' id='easy_search_save_button' class='page_button' value='Easy Search' onclick='open_easy_search(document.getElementById("search_entry").value)' style='display: inline-block;width: auto' />&nbsp;&nbsp;<div class="square_button" onclick="do_search(document.getElementById('search_entry').value)"><img src="<?php echo plugins_url("../images/search_button_registration.png",__FILE__) ?>" style="width: 100%" /></div></div>
				<div id="right_panel_easy_search" class="right_panel_form">
					<table cellpadding='0' cellspacing='0'>
						<tr><td class='label_column'>Must contain ALL of these Words:</td><td class='content_column'><input id='easy_search_all' type='text' placeholder='e.g. animal hospital' /></td></tr>
						<tr><td class='label_column'>YouTube Channel URL:</td><td class='content_column'><input id='easy_search_youtube' type='text' placeholder='https://www.YouTube.com/channel/abcd' /></td></tr>
						<tr style='display: none'><td class='label_column'>Hashtag:</td><td class='content_column'><input id='easy_search_hash' type='text' placeholder='e.g. #animals' /></td></tr>
						<tr><td class='label_column'>Exact Phrase:</td><td class='content_column'><input id='easy_search_phrase' type='text' placeholder='e.g. United States' /></td></tr>
						<tr><td class='label_column'>Any of these Words:</td><td class='content_column'><input id='easy_search_any' type='text' placeholder='e.g. dog cat bird fish' /></td></tr>
						<tr><td class='label_column'>None of these Words:</td><td class='content_column'><input id='easy_search_none' type='text' placeholder='e.g. hunting fishing' /></td></tr>
						<tr><td class='label_column'>Exclude these Domains:</td><td class='content_column'><div style='padding-bottom: 4px'><table style='width: initial;float: left'><tr><td><input type="text" class="form_field_input" id="easy_search_options_domain" value="" placeholder="Add a domain name" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px"></td><td style='width: 40px'><input type="button" value="+" class="page_button" style="height: 38px;width: 100%;margin: 0;display: inline-block" onclick="options_add_exclude(document.getElementById('easy_search_options_domain').value)"></td></tr></table><div style='float: right;margin-top: 8px'><span onclick='filter_popup_open()' class='blue' style='cursor:pointer;' >Content Settings</span><div id='content_filter_popup' style='z-index:10000;display:none;position:absolute;top: 0;bottom:0;left:0;right:0;background-color: rgba(0,0,0,0.1)' ><div style='width: 100%;max-width: 600px;padding: 20px;background-color: #fff;color: #777;text-align: left;margin: 50px auto 0 auto'><p style='font-size: 16px'>Most offensive videos are already blocked.</p><p style='font-size: 16px'>Only use this feature if you don't want videos that even mentions these subjects. Please note this may limit the quantity of videos you receive.</p>   <table cellpadding="6" style="width: 150px;margin: auto auto;background-color: white"><tr><td>Gore</td><td><input type='checkbox' id='content_filter_gore' /></td></tr><tr><td>Profanity</td><td><input type='checkbox' id='content_filter_profanity' /></td></tr><tr><td>Religion</td><td><input type='checkbox' id='content_filter_religion' /></td></tr><tr><td>Sex</td><td><input type='checkbox' id='content_filter_sex' /></td></tr><tr><td>Violence</td><td><input type='checkbox' id='content_filter_violence' /></td></tr></table><p style='font-size: 16px'>* We try our best to make sure all the videos you curate are appropriate, but there is no 100% guaranty.<p><p style='text-align: center'> <input type='button' class="page_button" value='Save Changes' onclick='filter_popup_save()' />&nbsp;&nbsp;<input type='button' class="page_button" value='Close' onclick='filter_popup_close()' /></p></div></div></div></div><div id='easy_search_domains' class='easy_search_domains'></div></td></tr>
						<tr><td colspan='2' style='text-align: right;padding: 8px 0;color: #777;font-size: 14px'><div style='display: inline-block;text-align: left;vertical-align: middle;margin-right:18px'><input type='radio' id="search_embed_0" name='search_embed' value='0'/> Allow All Results <br /><input type='radio' id="search_embed_2" name='search_embed' value='2'/> Embedable Video and Posts Only<br /><input type='radio' id="search_embed_1" name='search_embed' value='1'/> Embedable Video Only</div> <input type='button' id='easy_search_save_button' class='page_button' value='Save Search' onclick='save_search_open(true)' style='display: inline-block;width: auto' />&nbsp;&nbsp;<input type='button' id='easy_search_cancel_button' class='page_button' value='Advanced Search' onclick='open_advanced_search(0)' style='display: inline-block;width: auto' />&nbsp;&nbsp;<input type='button' id='easy_search_search_button' class='page_button' value='Search' onclick='easy_search_search(true)' style='display: inline-block;width: auto' /></td></tr></table>
				</div>
			<div id="search_options_wrapper" class='blue' style='text-align: right;max-width: 1200px;margin-bottom: 8px'>   <span style='cursor: pointer' onclick='toggle_search_options()' id='search_options_label'>Search Order</span><div id='search_options' style='display: none;color: #777'>Sort by Date: <input type='checkbox' id='sort_by_date' onclick='toggle_sort_order()' checked />&nbsp;&nbsp;Include Previously Posted: <input type='checkbox' id='include_previously_posted' /></div></div>
				<div id="right_panel_suggestions" class="right_panel_info">
					<h2 style='text-align: center'>Suggested Search Strategies</h2>
					<table>
						<tr><td style='min-width: 180px'><p><b>Example #1:</b></p></td><td><p>Search for "animals" not "cats" or "dogs":</p></td></tr>
						<tr><td></td><td><p>animal -cat -dog</p></td></tr>
						<tr><td><p><b>Example #2:</b></p></td><td><p>Search for a subject or idea, use hashtags. (To find relevant hashtags, use <a href='https://hashtagify.me/' target='_blank'>https://hashtagify.me/</a>)</p>
								<p>Search for stories about "adopting" "pets" not "cats" or "dogs":</p>
								<p>#adopt pet -cat -dog</p></td></tr>
						<tr><td><p><b>Example #3:</b></td><td><p>If search results include irrelevant videos, look at text surrounding the video for keywords to exclude in future searches.</p></td></tr>
					</table>
					<p style='text-align: center'><input type='checkbox' id='show_suggestions' > Don’t show again</p>
					<p style='text-align: center'><input type="button" class="form_submit_btn_light" value="Ok" onclick="close_suggestions()" style="display: inline-block" /></p>
				</div>
				<div id="right_panel_learning"  class="right_panel_info">
									<div id="learning_message" style="display: none">
					<h2 style='text-align: center;font-size: 1.75em'>Learning Mode</h2>
					<table>
						<tr><td><p>When you create a new search, MondoPlayer starts learning what you want. It can take up to 2 weeks for this process to complete.</p></td></tr>
					</table>
									</div>
									<div id="learning_complex" style="display: none">
					<h2 style='text-align: center;font-size: 1.75em'>Complex Search Term</h2>
					<table>
						<tr><td><p>To curate videos daily, you'll get better results using simple search terms with 1 or 2 words.</p></td></tr>
					</table>
						</div>
					<p style='text-align: center'><input type='checkbox' id='show_learning' > Don’t show again</p>
					<p style='text-align: center'><input type="button" class="form_submit_btn_light" value="Ok" onclick="close_learning()" style="display: inline-block" /></p>
				</div>
				<h2 id='edit_post_titles_label' style='display:none'>Edit Post Titles</h2>
				<div id="right_panel_output">
				<div class="right_panel_pages_wrapper"><div><div class="right_panel_pages" id="right_panel_pages"></div></div><div id="right_panel_submit_button_wrapper" style='display: inline-block'><div class="page_button" id="show_approved_button" onclick="toggle_show_approved(false)" style='background-color: rgb(238, 129, 56)'>Continue</div><div class="page_button" id="bulk_submit_button" onclick="show_bulk_submit()" style='background-color: rgb(238, 129, 56);display: none'>Submit Approved Posts</div></div></div>
        <div id="right_panel_content" style='max-width: 1210px'></div>
				<div class="right_panel_pages_wrapper"><div><div class="right_panel_pages" id="right_panel_pages_bottom"></div></div><div id="right_panel_submit_button_wrapper_bottom" style='display: inline-block'><div class="page_button" id="show_approved_button_bottom" onclick="toggle_show_approved(false)" style='background-color: rgb(238, 129, 56)'>Continue</div><div class="page_button" id="bulk_submit_button_bottom" onclick="show_bulk_submit()" style='background-color: rgb(238, 129, 56);display: none'>Submit Approved Posts</div></div></div>
				<div id="right_panel_new_search"><p style='text-align: center'>Are you happy with the quality of this search result?<p><p style="text-align:center"><input type="button" class="form_submit_btn_light" value="Yes" onclick="new_search_result(0)" style="display: inline-block" />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="No" onclick="new_search_result(1)" style="display: inline-block" /></p></div>
				<div id="right_panel_new_search_notify"><p style='text-align: center'>Notify our search team. We’ll contact you soon.<p><p style="text-align:center"><input type="button" class="form_submit_btn_light" value="Yes" onclick="new_search_result(2)" style="display: inline-block" />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="No" onclick="new_search_result(3)" style="display: inline-block" /></p></div>
			<div id="right_panel_new_search_message" onclick="document.getElementById('right_panel_new_search_message').style.display='none'"><p style='text-align: center'>The Search Team has Received your Report<p></div>
				</div>
				</div>
<div id="bulk_submit_page" class="right_sub_page right_panel_form" style="display: none">
<h1>Submit Posts</h1>
<div id="bulk_submit_page_form">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'><tr <?php if (get_option('mondoplayer_visitor_number', -1) > -1) { echo "style='display: none'";} ?>><td class='label_column'>Send Posts to This Service</td><td class='content_column'><div class="service_select" id='bulk_submit_service_select' style="width:100%"><select class="form_field_input" id="bulk_submit_service" ></select></div><div id="bulk_submit_service_error" class="form_field_error"></div></td></tr></table>

<div id="bulk_submit_project_details">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>Project</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="bulk_submit_project_entry"><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="bulk_submit_project_title" value="" placeholder="Enter a name for this project" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" class="form_submit_btn rounded_right" style="margin: 0;display: inline-block;width: 38px" value="+" onclick="bulk_submit_add_project()"></td></tr></table></div><div id="bulk_submit_project_error" class="form_field_error"></div>
<div id="bulk_submit_project_list"></div></td><td style='width: 50px;border:0;padding:0;padding-bottom:2px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width: 50px;margin-left:4px" value="Add" id="bulk_submit_add_new_project_button" onclick="bulk_submit_add_new_project('')"></td></tr></table></td></tr>
</table>
</div>

<div id="bulk_submit_rss_details">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>RSS Feed Name</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="bulk_submit_feed_entry"><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="bulk_submit_feed_title" value="" placeholder="Enter a name for this RSS feed" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" class="form_submit_btn rounded_right" style="margin: 0;display: inline-block;width: 38px" value="+" onclick="bulk_submit_add_feed()"></td></tr></table></div><div id="bulk_submit_feed_title_error" class="form_field_error"></div>
<div id="bulk_submit_feed_list"></div></td><td style='width: 50px;border:0;padding:0;padding-bottom:2px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width: 50px;margin-left:4px" value="Add" id="bulk_submit_add_new_feed_button" onclick="bulk_submit_add_new_feed('')"></td></tr></table></td></tr>
		<tr><td class='label_column'>Feed URL</td><td class='content_column'><div id='bulk_submit_feed_url'></div></td></tr>
</table>
</div>
<table id="bulk_submit_categories_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Categories</td><td class='content_column'><select id='bulk_submit_categories' class="form_field_input" style='width:initial;height: 38px'></select><input type="button" id="bulk_submit_categories_create_button" class="form_submit_btn rounded_right" style="width: 38px;height: 38px;margin: 0;display: inline-block; margin-right: 30px" value="+" onclick="bulk_submit_add_categories()" /><input type="button" id="bulk_submit_categories_button" class="form_submit_btn rounded_right" style="height: 38px;margin: 0;display: inline-block;" value="Create New Category" onclick="bulk_submit_open_create_category()" /> <div id="bulk_submit_selected_categories" class="easy_search_domains"></div></td></tr>
	<tr><td class='label_column'>Hashtags</td><td class='content_column'><input type="text" class="form_field_input" id="bulk_submit_hashtags" value="" placeholder="e.g. #example1 #example2 #example3" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td></tr>
	<tr <?php if (get_option('mondoplayer_visitor_number', -1) > -1) { echo "style='display: none'";} ?>><td class='label_column'>Author</td><td class='content_column'><select id='bulk_submit_users' class="form_field_input" style='width:initial;height: 38px'></select></td></tr>
</table>
<div id="bulk_submit_campaign_details">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Campaign</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="bulk_submit_campaign_entry"><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="bulk_submit_campaign_title" value="" placeholder="Enter a name for this campaign" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" class="form_submit_btn rounded_right" style="margin: 0;display: inline-block;width: 38px" value="+" onclick="bulk_submit_add_campaign()"></td></tr></table></div><div id="bulk_submit_campaign_error" class="form_field_error"></div>
					<div id="bulk_submit_campaign_list"></div></td><td style='width: 50px;border:0;padding:0;padding-bottom:2px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width: 50px;margin-left: 4px" value="Add" id="bulk_submit_add_new_campaign_button" onclick="bulk_submit_add_new_campaign('')"></td></tr></table></td></tr>
</table>
</div>
<div id="bulk_submit_schedule_optional_wrapper">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>Set Post Schedule </td><td class='content_column'><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_schedule_optional" value="on" onchange="bulk_submit_schedule_optional(1)" ></td></tr>
	</table>
</div>
<div id="bulk_submit_schedule_details">
	<table style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>Start Date/Time for Your Schedule</td><td class='content_column'><select id="bulk_submit_schedule_date" class="form_field_input" style="width: initial;padding: 10px 16px;margin-right: 4px;height: 38px">
</select><select id="bulk_submit_schedule_time" class="form_field_input" style="width: initial;padding: 10px 16px;margin-right: 4px;height: 38px">
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
</select></td></tr>
<tr><td class='label_column'>Schedule</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="bulk_submit_schedule_list" style="padding-bottom:20px;min-height: 50px;"></div></td><td style='width: 50px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width:50px;margin-left: 4px" value="Add" id="bulk_submit_add_new_schedule_button" onclick="bulk_submit_add_new_schedule(-1)"></td></tr></table><div id="bulk_submit_schedule_error" class="form_field_error"></div></td></tr>
	</table>
</div>
<div id="bulk_submit_api_details">
	<table style='width: 100%' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>Account</td><td class='content_column'><select class="form_field_input" id="bulk_submit_api_company_picker" style="display: none"></select><select class="form_field_input" id="bulk_submit_api_initiative_picker"  style="display: none"></select><div id="bulk_submit_api_service_picker" style='background-color: white'></div></td></tr>
	</table>
</div>
<table style='width: 100%' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Only Post Videos with Thumbnails.</td><td class='content_column' style='vertical-align: middle;text-align:left'><input type="checkbox" class="form_field_checkbox_input" id="onlyPostVideosWithThumbnails_submit" value="on" checked ></td></tr>
	</table>
<table id="bulk_submit_state_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Post Status </td><td class='content_column'><select id='bulk_submit_status' class="form_field_input" style='width:initial;height: 38px'><option value="-1" >Draft</option><option class="0" value="1" selected>Publish</option></select></td></tr>
</table>
<div class="form_submit_btn-wrapper"><input type="button" id="bulk_submits_save_button" class="form_submit_btn_light" value="Ok" onclick="send_posts()" style="margin: 0 10px;width: 200px" /> <input type="button" class="form_submit_btn_light" value="Back" onclick="document.getElementById('right_panel_search_page').style.display='block';document.getElementById('bulk_submit_page').style.display='none';" id="bulk_submits_close_button" style="margin: 0 10px;width: 200px" /></div>
</div>
<div id="bulk_submit_sent">
	<div id="bulk_submit_sent_title"></div>
	<p style="text-align: center"><img src="<?php echo plugins_url("../images/airplane_image.png",__FILE__) ?>" /></p>
	<p style="text-align: center">Save these posts so you can edit or post to other accounts?</p>

	<div class="options_popup_buttons"><input type="button" class="form_submit_btn_light" value="Save a Copy" onclick="bulk_submit_save_approved()" style='width:200px' />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="Delete" onclick="bulk_submit_delete_approved()" style='width: 200px' /></div>
</div>
</div>
<div id="bulk_submit_edit_schedule" class='right_sub_page right_panel_form' style="display: none">
<h2 style='text-align: left;color: #777;'>Edit the Schedule</h2>
<table style='width: 100%' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Schedule Name</td><td class='content_column'><input type="text" class="form_field_input" id="bulk_submit_schedule_title" value="" placeholder="Enter a name for this schedule" autocorrect="off" autocapitalize="off" spellcheck="true" ><div id='bulk_submit_schedule_title_error'></div></td></tr>
	<tr><td class='label_column'>Add Schedule Entry</td><td calss='content_column'><select id="bulk_submit_schedule_hour" class="form_field_input" style="height: 38px;width: initial;padding: 10px 16px;margin-right: 4px">
<option value="0">00</option>
<option value="1">01</option>
<option value="2">02</option>
<option value="3">03</option>
<option value="4">04</option>
<option value="5">05</option>
<option value="6">06</option>
<option value="7">07</option>
<option value="8">08</option>
<option value="9">09</option>
<option value="10">10</option>
<option value="11">11</option>
<option value="12">12</option>
<option value="13">13</option>
<option value="14">14</option>
<option value="15">15</option>
<option value="16">16</option>
<option value="17">17</option>
<option value="18">18</option>
<option value="19">19</option>
<option value="20">20</option>
<option value="21">21</option>
<option value="22">22</option>
<option value="23">23</option>
</select> : <select id="bulk_submit_schedule_minute" class="form_field_input" style="height: 38px;width: initial;padding: 10px 16px;margin-right: 4px">
<option value="0">00</option>
<option value="1">15</option>
<option value="2">30</option>
<option value="3">45</option>
</select>
<div class="form_field_wrapper" style="width: auto;display: inline-block;vertical-align: middle;padding-top: 0">
	<input type="button" class="form_submit_btn_light" value="Add" onclick="bulk_submit_add_schedule_entry()" ></div><br />
<div class="form_field_wrapper" style="width: auto;display: inline-block;vertical-align: middle">
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_1" value="on" >Mon</div>
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_2" value="on" >Tue</div>
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_3" value="on" >Wed</div>
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_4" value="on" >Thu</div>
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_5" value="on" >Fri</div>
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_6" value="on" >Sat</div>
	<div class="autopilot_email_schedule_day"><input type="checkbox" class="form_field_checkbox_input" id="bulk_submit_email_schedule_day_0" value="on" >Sun</div>
</div></td><tr>
	<tr><td class='label_column'>Schedule Entries</td><td class='content_column'><div id="bulk_submit_schedule_entries"></div>
			<div id="bulk_submit_schedule_entries_error" class="form_field_error"></div></td></tr>
</table>
<div class="options_popup_buttons"><input type="button" class="form_submit_btn_light" value="Save" onclick="bulk_submit_save_schedule()" style='width: 200px' />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="Back" onclick="bulk_submit_close_schedule()" style='width: 200px' /></div>
</div>

<div id="bulk_submit_create_category_details" class='right_sub_page right_panel_form' style="display: none">
<h2 style='text-align: left;color: #777;'>Create a New Category</h2>
<table style='width: 100%' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Enter a name for the new category:</td><td class='content_column'><input type="text" class="form_field_input" id="bulk_submit_create_category" value="" placeholder="Enter a name for this category" autocorrect="off" autocapitalize="off" spellcheck="true" style='width: 50%;vertical-align: middle;margin-right: 8px' /><div style='display:inline-block;vertical-align: middle;color: #999'>Hide in Main Vlog Roll&nbsp;&nbsp;<input type='checkbox' id='bulk_submit_create_category_hide' /></div></td></tr>
</table>
<div class="options_popup_buttons"><input type="button" class="form_submit_btn_light" value="Create Category" onclick="bulk_submit_create_category()" style='width: 200px' />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="Back" onclick="bulk_submit_close_create_category()" style='width: 200px' /></div>
			</div>
<div id="save_search_details" class='right_sub_page right_panel_form' style="display: none">
<h2 style='text-align: left;color: #777;'>Save Search</h2>
<table style='width: 100%' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Update an Existing Search:</td><td class='content_column'><div style='padding: 4px;background-color: white' id='save_search_list'></div></td></tr>
	<tr><td class='label_column'>Enter a Name for a New Search:</td><td class='content_column'><input type="text" class="form_field_input" id="save_search_name" value="" placeholder="Enter a name for this search" autocorrect="off" autocapitalize="off" spellcheck="true" ></td></tr>
</table>
<div class="options_popup_buttons"><input type="button" class="form_submit_btn_light" value="Save" onclick="save_search(0,'')" style='width: 200px' />&nbsp;&nbsp;<input type="button" class="form_submit_btn_light" value="Back" onclick="close_save_search()" style='width: 200px' /></div>

</div>

		</div>
		<div id='right_panel_saved_searches' style="flex-basis: 200px;min-width: 200px;max-width: 1200px;padding:0 8px;flex-grow: 1;flex-shrink: 4">
		<p><b>Saved Searches:</b></p>
		<div id='topics_list'></div>
		</div>
	</div>
</div>
<?php
	}

}
