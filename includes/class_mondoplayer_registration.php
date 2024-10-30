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

class MondoPlayer_Registration {
	public $license_key;
	public $is_subscribed;
	public $is_trial;
	public $is_mastermind;
	public $screen_name;
	public $userid;

	function __construct() {
		//add_action( 'admin_init', array($this,'register_settings_fields') );
		$this->license_key = get_option( 'mondoplayer_license_key' );
		if ($this->license_key === false) {
		} else {
			$this->is_subscribed = get_option('mondoplayer_is_subscribed');
			$this->is_trial = get_option('mondoplayer_is_trial');
			$this->screen_name = get_option('mondoplayer_screen_name');
			$this->userid = get_option('mondoplayer_userid');
			$this->is_mastermind = get_option('mondoplayer_is_mastermind');
		}
	}

	function register_settings_fields() {
		#error_log("register_settings_fields");
		register_setting( 'mondoplayer_menu_slug', 'mondoplayer_license_key', array('type'=>'text','sanitize_callback'=>'wp_filter_nohtml_kses', 'show_in_rest' => false) );
		register_setting( 'mondoplayer_menu_slug', 'mondoplayer_is_subscribed', array('type'=>'integer','sanitize_callback'=>'wp_filter_nohtml_kses', 'show_in_rest' => false) );
		register_setting( 'mondoplayer_menu_slug', 'mondpoplayer_is_trial', array('type'=>'integer','sanitize_callback'=>'wp_filter_nohtml_kses', 'show_in_rest' => false) );
		register_setting( 'mondoplayer_menu_slug', 'mondoplayer_screen_name', array('type'=>'text','sanitize_callback'=>'wp_filter_nohtml_kses', 'show_in_rest' => false) );
		register_setting( 'mondoplayer_menu_slug', 'mondoplayer_userid', array('type'=>'text','sanitize_callback'=>'wp_filter_nohtml_kses', 'show_in_rest' => false) );
		register_setting( 'mondoplayer_menu_slug', 'mondoplayer_is_mastermind', array('type'=>'text','sanitize_callback'=>'wp_filter_nohtml_kses', 'show_in_rest' => false) );
	}

	function sanitize($input, $setting) {
		#error_log("Sanitize: " . $input);
		return $input;
	}

	function login_page() {
?>
	<script>
		var wp_site = "<?php echo get_site_url() ?>";
		var license_key = "";
		var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';

	</script>
	<div id="login_page">
	<div class="registration_single" style='background-color: white'><div class="slide_form" style="text-align: center;margin-top: 100px"><div class="form-page_form-header" style='max-width: 400px;margin: 20px;display: inline-block;text-align:left;vertical-align: top'><p style='text-align: center;line-height: 1'><img src="<?php echo plugins_url("../images/mondoplayer_220.png",__FILE__) ?>" alt="Mondo Player"><br />Share More Video</p>
<p style='font-size: x-large;text-align: center;line-height: 1.25'>Welcome<br>to</br>Automated Video Curation</p>
<hr style="width: 50%; border: 1px solid rgb(101, 205, 196);">
<ul style='list-style: square;margin: 10px 30px;font-size: 15px;line-height:1.5'>
<li>Automated Video Curation and Posting</li>
<li>Works with all Popular Social Media Tools</li>
<li>Post Video directly to WordPress</li>
<li>Curate Video from High Quality Sources - not just YouTube</li>
<li>Find Video even if its embedded in an Article</li>
<li>Attract Free Organic Traffic - improve SEO</li>
<li>Boost Audience Engagement</li>
</ul></div><div class="form-page_form-header" style='max-width: 400px;margin: 20px;display: inline-block'><div class="form-page_form-header" style='max-width: 400px;margin: 0 auto;margin-top: 100px'>
<h2 class="form-page_form-heading" id="login_form_header" style="text-align: left;margin-bottom: 4px">Sign in</h2><div id="toggle_login" class="text_link" style='text-align: left'><a href='https://www.mondoplayer.com/pricing/'>Create MondoPlayer account</a></div></div>
	<form class="form" id="login_form" style="max-width: 400px;margin: 0 auto">
		<div class="form_field_wrapper"><input type="text" class="form_field_input" id="username" value="" placeholder="Email Address" autocorrect="off" autocapitalize="off" spellcheck="true" style=''><div id="username_error" class="form_field_error"></div></div>
		<div class="form_field_wrapper"><input type="password" class="form_field_input" id="password" value="" placeholder="Password (6 characters or more)" style=''><div id="password_error" class="form_field_error"></div></div>
		<div class="form_submit_btn-wrapper" style="display: block;text-align: right"><input type="button" class="form_submit_btn_light" onclick="login()" value="Sign in" id="login_button" style='display: inline-block' /><div id="login_error" class="form_field_error" style="margin-top: 10px"></div></div></form>
		<form id='wp_update' style='display: none' method='post' >
<?php
	settings_fields( 'mondoplayer_menu_slug' );
	do_settings_sections( 'mondoplayer_menu_slug' );
?>
<input type='text' id='wp_license_key' name='mondoplayer_license_key' value='' />
<input type='text' id='wp_is_subscribed' name='mondoplayer_is_subscribed' value='' />
<input type='text' id='wp_is_trial' name='mondoplayer_is_trial' value='' />
<input type='text' id='wp_screen_name' name='mondoplayer_screen_name' value='' />
<input type='text' id='wp_userid' name='mondoplayer_userid' value='' />
<input type='text' id='wp_is_mastermind' name='mondoplayer_is_mastermind' value='' />
</form>
		<form class="form" id="recover_password_form" style="display: none">
			<div class="form_field_wrapper"><input type="text" class="form_field_input" id="recover_password_email" value="" placeholder="Enter your email address" autocorrect="off" autocapitalize="off" spellcheck="true"><div id="recover_password_error" class="form_field_error"></div></div>
			<div class="form_submit_btn-wrapper" style="display: block;text-align: center"><input type="button" class="form_submit_btn_light" onclick="recover_password()" value="Recover Password" style="margin-bottom: 12px" id="recover_password_button" /><br /><span class="text_link" onclick="toggle_login_form(1)">Back</span></div>
		</form>
		</div></div></div>
	</div>
	<div id="registration_page1" style="display: none">
		<div class="section_flex section_flex_registration_form"><div class="slide_top_panel"><div class="slide_panel_text" style="font-size: xx-large;">Create Your Account</div><div class="slide_rule"><hr style="width: 50%; border: 1px solid rgb(101, 205, 196);"></div><div class="slide_panel_text">Personalize your profile to sync<br />to all devices</div></div><div class="slide_form" style="max-width: 500px"><div class="form-page_form-header"><h2 class="form-page_form-heading" style="text-align: center; color: #141414;">Account Setup</h2></div>
<form class="form" id="registration_page1_form"><div class="form_field_wrapper" style="padding: 0px 20px;background-color: #eee;"><table>
			<tr><td><input type="checkbox" class="form_field_checkbox_input" id="playOnlyDuringWifi_reg" value="on" checked></td><td><label class="form_field_checkbox_label" for="playOnlyDuringWifi">Play Videos over Wi-Fi Only.</label></td></tr></table>
	</div><div class="form_field_wrapper" style="padding: 0px 20px;background-color: #eee;">
		<table><tr><td><input type="checkbox" class="form_field_checkbox_input" id="playDuringRoaming_reg" value="on" checked></td><td><label class="form_field_checkbox_label" for="playDuringRoaming">Do Not Play videos when my phone is Roaming.</label></td></tr></table>
	</div><div class="form_field_wrapper" style="padding: 0px 20px;background-color: #eee;">
		<table><tr><td><input type="checkbox" class="form_field_checkbox_input" id="notification_reg" value="on" checked></td><td><label class="form_field_checkbox_label" for="notification">Allow MondoPlayer to send Push Notifications which may include alerts, sounds and icon badges.  These can be configured in the Options screen.</label></td></tr></table>
	</div><div class="form_field_wrapper" style="padding: 0px 20px;background-color: #eee;">
		<table><tr><td><input type="checkbox" class="form_field_checkbox_input" id="emailFlag_reg" value="on" checked></td><td><label class="form_field_checkbox_label" for="emailFlag">Allow MondoTag.com Inc. to send me emails about MondoPlayer.  You can withdraw your consent at any time in the Options screen.</label></td></tr></table>
	</div><div class="form_field_wrapper" style="padding: 0px 20px;background-color: #eee;">
		<table><tr><td><input type="checkbox" class="form_field_checkbox_input" id="onlyPostVideosWithThumbnails_reg" value="on" checked></td><td><label class="form_field_checkbox_label" for="onlyPostVideosWithThumbnails">Only Post Videos with Thumbnails</label></td></tr></table>
	</div><div class="form_field_wrapper" style="padding: 0px 20px;background-color: #eee;">
		<table><tr><td><input type="checkbox" class="form_field_checkbox_input" id="agreement" value="on"></td><td><label class="form_field_checkbox_label" for="agreement">I agree to the <a href="https://www.mondoplayer.com/licence/" target="_blank">License Agreement</a> terms.</label></td></tr></table>
	</div><div class="form_field_wrapper" style="padding: 20px;background-color: #eee;">
		<p><b>I agree to the installation of MondoPlayer, a product of MondoTag.com Inc., and future updates.  MondoPlayer lets you search for and play streams of video.</b></p><p><b>Allow MondoPlayer to use my usage information to personalize my search results and content.  MondoPlayer relies on this information to function.  See our <a href="https://www.mondoplayer.com/privacy-policy/" target="_blank">Privacy Policy</a>.  If you choose not to allow it, MondoPlayer will not install.  You can withdraw your consent in the future.  To request removal or disabling of MondoPlayer, <a href="https://www.mondoplayer.com/contact-us/" target="_blank">Contact Us</a>.</b></p>
	</div><div class="form_submit_btn-wrapper"><input type="button" class="form_submit_btn_light" value="Continue" onclick="regstration_page1()" /><div id="registration1_error" class="form_field_error" style="margin-top: 10px"></div></div></form></div></div>
	</div>
	<div id="registration_page3" style="display: none" onclick="show_page('search_page')">
		<div class="registration_single" style='max-width: 800px'>
			<div class="slide_panel_text" style="font-size: xx-large;text-align: center;">Welcome to <br /><img src="<?php echo plugins_url("../images/mondoplayer_220.png",__FILE__) ?>" style='margin-top: 8px'/></div>
			<div class="slide_rule"><hr style="width: 50%; border: 1px solid rgb(101, 205, 196);"></div>
			<div class="slide_panel_text" style="font-size: xx-large;text-align: center;">Use AutoPilot</div>
			<div class="slide_panel_text" style="font-size: 20px;">
				<table style="max-width: 500px; margin: 0 auto">
					<tr><td><img src="<?php echo plugins_url("../images/autocurate_registration.png",__FILE__) ?>" style="padding: 10px"/></td><td style='text-align: left'>Automate Video Curation and Sharing</td></tr>
					<tr><td><img src="<?php echo plugins_url("../images/autosocial_registration.png",__FILE__) ?>" style="padding: 10px"/></td><td style='text-align: left'>Automate your Social Media Tools, Content Hubs, Newsletters</td></tr>
				</table>
			</div>
			<div class="slide_panel_text" style="font-size: x-large;padding-top: 20px"><input type='button' value='START SHARING' class="form_submit_btn_light" onclick="window.location='admin.php?page=mondoplayer_menu_slug'" /></div>
		</div>
	</div>
<?php
	}
}

