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

class MondoPlayer_Notifications {
	public $license_key;
	function __construct() {
		global $wpdb;
		$this->license_key = get_option( 'mondoplayer_license_key' );
	}

	function notifications_page() {
		global $wp_rewrite;
		global $wpdb;
		update_option("mondoplayer_show_notification", 0);
		require_once(plugin_dir_path(__FILE__).'class_mondoplayer_autopilot.php');
		$mondoplayer_autopilot = new MondoPlayer_Autopilot();
		$mondoplayer_autopilot->sync_autopilots();

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
			$user_string .= "{'name':'" . $user->user_nicename . "','user_id':" . $user->ID . "},";
		}
		$user_string .= "]";

?>
<script>
var license_key = "<?php echo addslashes($this->license_key) ?>";
var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';
var is_subscribed = "<?php echo addslashes($mondoplayer_autopilot->is_subscribed) ?>";
var is_trial = "<?php echo addslashes($mondoplayer_autopilot->is_trial) ?>";
var screen_name = "<?php echo addslashes($mondoplayer_autopilot->screen_name) ?>";
var image_url = "<?php echo plugins_url('../images/',__FILE__) ?>";
var autopilot_list = <?php echo $mondoplayer_autopilot->autopilot_string ?>;
var category_list = <?php echo $category_string ?>;
var user_list = <?php echo $user_string ?>;
</script>
<style>
#wpcontent {
	background-color: white;
}
</style>

<div id="notifications_page" class="right_sub_page right_panel_form" style='background-color: white'>
	<h1>Notifications</h1>
	<input type='hidden' id='search_entry' />
	<div id="notifications" style='color: #141414'></div>
	<div id="search_easy_notifications" class="right_panel_form" style='display: none'>
		<div id='search_easy_notifications_text' style="color: #141414"></div>
						<table cellpadding='0' cellspacing='0'>
							<tr><td class='label_column'>Must contain ALL of these Words:</td><td class='content_column'><input id='easy_search_all' type='text' placeholder='eg. animal hospital' /></td></tr>
							<tr><td class='label_column'>Hashtag:</td><td class='content_column'><input id='easy_search_hash' type='text' placeholder='eg. #animals' /></td></tr>
							<tr><td class='label_column'>Exact Word or Phrase:</td><td class='content_column'><input id='easy_search_phrase' type='text' placeholder='eg. United States' /></td></tr>
							<tr><td class='label_column'>Any of these Words:</td><td class='content_column'><input id='easy_search_any' type='text' placeholder='eg. dog cat bird fish' /></td></tr>
							<tr><td class='label_column'>None of these Words:</td><td class='content_column'><input id='easy_search_none' type='text' placeholder='eg. hunting fishing' /></td></tr>

							<tr><td colspan='2' style='text-align: right;padding: 8px 0'><input type='button' id='easy_search_search_button_notifications' class='page_button' value='Save Changes' onclick='notifications_update_search_term();' style='display: inline-block;width: auto;margin-left: 4px;' /><input type='button' id='easy_search_cancel_button_notifications' class='page_button' value='Cancel' onclick='notifications_hide_search()' style='display: inline-block;width: auto;margin-left: 4px' /></td></tr></table>
			</div>
			<div id="notifications_contact_us" style='display: none;color: #141414'>
				<h2>Contact Us</h2>
				<table>
					<tr><td>From:</td><td><input type='text' id='notifications_contact_us_email' value='' style='width:100%' /></td></tr>
					<tr><td>Subject:</td><td><input type='text' id='notifications_contact_us_subject' value='' style='width:100%' /></td></tr>
					<tr><td>Message:</td><td><textarea id='notifications_contact_us_body' style='width:100%;height: 300px' ></textarea></td></tr>
					<tr><td></td><td style='text-align: right'><input type='button' class='page_button' style='display: inline-block;width: auto;margin-left: 4px' value='Send' onclick='send_notification_message()' /></td></tr>
				</table>
			</div>

<div style='display: none'>
<div id='autopilot_page_title'></div>
<div id='show_add_autopilot'></div>
<div id='mondoplayer_autopilot_table'></div>
<div id='new_autopilot_wrapper'></div>
<form class="form" id="autopilot_form">
	<div id='autopilots_list'></div>
	<div id='autopilots_content'>
	<table id="autopilot_form_top" style='width: 100%;max-width: 1200px' cellspacing='0' cellpadding='0'><tr><td class='label_column'>AutoPilot Name</td><td class='content_column'><input type="text" class="form_field_input" id="autopilot_title" value="" placeholder="Enter a name for this autopilot" autocorrect="off" autocapitalize="off" spellcheck="true" onblur="update_autopilot_title()"><div id="autopilot_title_error" class="form_field_error"></div></td></tr>
	</table>
		<div id="autopilot_search_popup" style='display: none;margin-top: 12px;flex-flow: row wrap-reverse;justify-content: flex-start;'>
			<div style='margin-left: 0px;max-width: 1230px;flex-grow: 4;flex-shrink: 1'>
			<div id="search_advanced_autopilot" class="right_panel_search_entry"><input type="text" id="search_entry" placeholder="Add a Search to this AutoPilot" /><div class='page_button' onclick='autopilot_add_search_term("",true)' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0'>Add</div><div id='advanced_search_delete_button_autopilot' class='page_button' onclick='autopilot_delete_search_term();' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0' >Delete</div><div class='page_button' onclick='open_easy_search(document.getElementById("search_entry").value)' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0'>Easy</div><div id='easy_search_cancel_button_autopilot' class='page_button' onclick='autopilot_hide_search()' style='margin: 0;margin-left: 4px;height: 38px;line-height: 32px;border: 0' >Cancel</div></div>
			<div id="search_easy_autopilot">
						<table cellpadding='0' cellspacing='0'>
							<tr><td class='label_column'>Must contain ALL of these Words:</td><td class='content_column'><input id='easy_search_all' type='text' placeholder='eg. animal hospital' /></td></tr>
							<tr><td class='label_column'>Hashtag:</td><td class='content_column'><input id='easy_search_hash' type='text' placeholder='eg. #animals' /></td></tr>
							<tr><td class='label_column'>Exact Word or Phrase:</td><td class='content_column'><input id='easy_search_phrase' type='text' placeholder='eg. United States' /></td></tr>
							<tr><td class='label_column'>Any of these Words:</td><td class='content_column'><input id='easy_search_any' type='text' placeholder='eg. dog cat bird fish' /></td></tr>
							<tr><td class='label_column'>None of these Words:</td><td class='content_column'><input id='easy_search_none' type='text' placeholder='eg. hunting fishing' /></td></tr>
							<tr><td colspan='2' style='text-align: right;padding: 8px 0'><input type='button' id='easy_search_search_button_autopilot' class='page_button' value='Add Search' onclick='autopilot_add_search_term("",false);' style='display: inline-block;width: auto;margin-left: 4px;' /><input type='button' id='easy_search_delete_button_autopilot' class='page_button' value='Delete' onclick='autopilot_delete_search_term();' style='display: inline-block;width: auto;' /><input type='button' id='easy_search_advanced_button_autopilot' class='page_button' value='Advanced' onclick='open_advanced_search(1)' style='display: inline-block;width: auto;margin-left: 4px' /><input type='button' id='easy_search_cancel_button_autopilot' class='page_button' value='Cancel' onclick='autopilot_hide_search()' style='display: inline-block;width: auto;margin-left: 4px' /></td></tr></table>
			</div>
		</div>
		<div id='right_panel_saved_searches' style="flex-basis: 200px;min-width: 200px;max-width: 1200px;padding:0 8px;flex-grow: 1;flex-shrink: 4;">
		<p style='color: #777'><b>Saved Searches:</b></p>
		<input type="hidden" id="save_search_name" value="" >
		<div id='topics_list'></div>
		</div>
	</div>
	<div id="autopilot_hashtags_screen1" style="display: none">
			<table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td class='label_column'>Posts to add '<span id='autopilot_hashtags_screen1_hashtag'></span>' to:</td><td class='content_column'><table style='width: initial' cellspacing='0' cellpadding='0'><tr><td><select class="form_field_input" id="autopilot_hashtags_search_term" style="width: 100%;height: 38px"></select></td><td style='width: 120px'><input type="button" value="Next" class="form_submit_btn rounded_right" style="width: auto;margin: 0;display: inline-block;border: 1px solid white;margin-left: 4px;" onclick="autopilot_hashtag_screen1_next()"><input type="button" value="Cancel" class="form_submit_btn rounded_right" style="width: auto;margin: 0;display: inline-block;border: 1px solid white;margin-left: 4px;" onclick="close_autopilot_hashtags()"></td></tr></table></td></tr></table>
	</div>
	<div id="autopilot_hashtags_screen2"  style="display: none">
		<table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td class='label_column'><span id='autopilot_hashtags_screen2_hashtag'></span></td><td class='content_column'><div id="autopilot_hashtag_organizer"></div></td></tr>
			<tr id="autopilot_hashtag_variable_count_display"><td class='label_column'></td><td class='content_column' style='color: #777'>Include <select id="autopilot_hashtag_variable_count" onchange="edit_search_hashtags_variable_count = document.getElementById('autopilot_hashtag_variable_count').value" style='width: auto;background-color: white'></select> variable hashtags per post</td></tr>
			<tr><td class='label_column'></td><td class='content_column' style='text-align:right'><input type="button" id="autopilots_hastags_save_button" class="form_submit_btn_light" value="Save" onclick="save_autopilot_hashtags()" style="display: inline-block;width: auto" /> <input type="button" id="autopilots_hastags_close_button" class="form_submit_btn_light" value="Cancel" onclick="close_autopilot_hashtags()" style="display: inline-block;width: auto" /></td></tr>
		</table>
	</div>
		<div id="autopilot_form_bottom" style='max-width: 1200px'>
<table style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>Searches for this AutoPilot</td><td class='content_column'><div id="autopilot_selected_keywords_error" class="form_field_error"></div>
				<table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td><div id="autopilot_selected_keywords" style="padding-bottom:20px;min-height: 50px;background-color: white" onclick="autopilot_show_search(false)" ></div></td><td style='width: 95px;text-align: right;'><input type="button" id="autopilot_search_button" class="form_submit_btn rounded_right" style="width: 95px;height: 38px;margin: 0;display: inline-block;margin-left: 4px" value="Add Search" onclick="autopilot_show_search(false)" /></td></tr></table></td></tr>
		<tr><td class='label_column'>Schedule Posts</td><td class='content_column'><div id="autopilot_schedule_selector" style="margin-bottom: 10px"><select id="autopilot_schedule_day" class="form_field_input" style="width: initial;margin-right: 4px;height: 38px">
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
<div id="autopilot_selected_schedules" style="padding-bottom:20px;min-height: 50px;background-color: white"></div></td></tr>
		<tr><td class='label_column'>Send Posts To This Service</td><td class='content_column'><div class="service_select" id='autopilot_service_select' style="width:100%"><select class="form_field_input" id="autopilot_service" style=";height: 38px"></select></div></td></tr>
	</table>

<table id="autopilot_categories_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Categories</td><td class='content_column'><select id='autopilot_categories' class="form_field_input" style='width:initial;height: 38px'></select><input type="button" id="autopilot_categories_button" class="form_submit_btn rounded_right" style="width: 38px;height: 38px;margin: 0;display: inline-block; margin-right: 30px" value="+" onclick="autopilot_add_categories()" /><input type="button" id="autopilot_categories_add_button" class="form_submit_btn rounded_right" style="height: 38px;margin: 0;display: inline-block;" value="Add Category" onclick="autopilot_open_create_category()" /><div id="autopilot_selected_categories" style="padding-bottom:20px;min-height: 50px;background-color: white"></div></td></tr>
	<tr><td class='label_column'>Author</td><td class='content_column'><select id='autopilot_users' class="form_field_input" style='width:initial;height: 38px'></select></td></tr>
</table>

<table id="autopilot_rss_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>RSS Feed Name</td><td class='content_column'><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><div id="autopilot_feed_entry"><table style='width: 100%' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="autopilot_feed_title" value="" placeholder="Enter a name for this feed" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" class="form_submit_btn rounded_right" style="margin: 0;display: inline-block;width: 38px" value="+" onclick="autopilot_add_feed()"></td></tr></table></div><div id="autopilot_feed_list" style='background-color: white'></div></td><td style='width: 50px;border:0;padding:0;padding-bottom:2px'><input type="button" class="form_submit_btn" style="padding: 4px 6px;display: inline-block;height: 38px;width: 50px;margin-left: 4px" value="Add" id="autopilot_add_new_feed_button" onclick="autopilot_add_new_feed('')" /></td></tr></table></td></tr>
	<tr><td class='label_column'>Feed URL</td><td class='content_column'><div id="autopilot_feed_url" style='height: 38px'></div></td></tr>
</table>
<table id="autopilot_thumbnail_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Only Videos with Thumbnails </td><td class='content_column' style='height: 38px;text-align: left'><input type="checkbox" class="form_field_checkbox_input" id="autopilot_feed_video_only" value="on" onchange="autopilot_toggle_video_only()" /></td></tr>
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
	<tr><td class='label_column'>Exclude these Domains:</td><td class='content_column'><div style='padding-bottom: 4px'><table style='width: initial'><tr><td><input type="text" class="form_field_input" id="easy_search_options_domain_autopilot" value="" placeholder="Add a domain name" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px"></td><td style='width: 40px'><input type="button" value="+" class="page_button" style="height: 38px;width: 100%;margin: 0;display: inline-block" onclick="options_add_exclude(document.getElementById('easy_search_options_domain_autopilot').value)"></td></tr></table></div><div id='easy_search_domains_autopilot' class='easy_search_domains'></div></td></tr>
</table>
<table id="autopilot_api_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Account</td><td class='content_column'><select class="form_field_input" id="autopilot_api_company_picker" style="display: none;height: 38px"></select><select class="form_field_input" id="autopilot_api_initiative_picker"  style="display: none;height: 38px"></select></td></tr>
	<tr><td class='label_column'></td><td class='content_column'><div id="autopilot_api_service_picker"></div></td></tr>
</table>
<table style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'>Automatic Hashtags</td><td class='content_column' style='color: #777'>On <div class="toggle_outside" onclick="toggle_hashtags()" ><div class="toggle_inside" id="add_hashtag_toggle" style="left: 18px"></div></div> Off</td></tr>
</table>
<table id="autopilot_hashtag_details" style='width: 100%;' cellspacing='0' cellpadding='0'>
	<tr><td class='label_column'></td><td class='content_column'><table style='width: initial' cellspacing='0' cellpadding='0'><tr><td style='border:0;padding:0;padding-bottom:2px'><input type="text" class="form_field_input" id="autopilot_hashtags" value="" placeholder="Add Hashtags" autocorrect="off" autocapitalize="off" spellcheck="true" style="width: 100%;padding: 10px 16px"></td><td style='border:0;padding:0;padding-bottom: 2px;width:38px'><input type="button" value="+" class="form_submit_btn rounded_right" style="width: 38px;margin: 0;display: inline-block" onclick="autopilot_add_hashtag()"></td></tr></table></td></tr>
</table>
	<table id='autopilot_hashtags_table' style='width: 100%' cellspacing='0' cellpadding='0'><tr><td class='label_column'></td><td class='content_column'><div id="autopilot_hashtags_list"></div></td></tr>
	</table>
	<table id="autopilot_hashtag_feed" style='width: 100%;' cellspacing='0' cellpadding='0'>
		<tr><td class='label_column'>RSS Feed URL with Hashtags</td><td class='content_column'><div id="autopilot_hashtags_feed_url"></div></td></tr>
	</table>

<div id="autopilot_keyword_picker" class="keyword_picker" onclick="hide_autopilot_keywords()" ><div id="autopilot_keyword_list" class="keyword_list"></div><div id="autopilot_keyword_buttons"><input type='button' value='Done' class="form_submit_btn_light" onclick='hide_autopilot_keywords();' style='width: auto' /></div></div>

<p class="submit"><input type="button" name="report" id="report" class="form_submit_btn_light" value="History" onclick='get_autopilot_report()' style='margin: 0;display: inline-block'> <input type="button" name="submit" id="submit" class="form_submit_btn_light" value="Save AutoPilot" onclick='save_autopilot()' style='margin: 0;display: inline-block'> <input type="button" name="autopilot_delete_button" id="autopilot_delete_button" class="form_submit_btn_light" value="Delete" onclick='delete_autopilot()' style='margin: 0;display: inline-block' > <input type='button' class="form_submit_btn_light" value='Cancel' onclick='show_add_autopilot(false)' class='blue' style='background-color: white; margin: 0;display: inline-block'/></p>

	</div>
	</div>
</form>
</div>

</div>

<?php
	}
}

