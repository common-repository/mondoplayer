var busy = false;

var version_id = 1.28;

var state = new Object();

var cur_date = new Date();
var timeZone = "America/New_York";
if (typeof Intl != "undefined") {
	timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

var has_localstorage = false;

var cur_topic = new Object();
cur_topic.alert_id = 0;
cur_topic.alert_title = "";
cur_topic.schedules = new Array();
cur_topic.schedules.push({"hour": 8, "timezone": timeZone, "offset": cur_date.getTimezoneOffset()});
cur_topic.hashtags = new Array();
cur_topic.search_terms = new Array();
cur_topic.allow_notification = 0;
cur_topic.allow_email = 0;

cur_autopilot = new Object();
cur_autopilot.autopilot_id = 0;
cur_autopilot.autopilot_report_id = 0;
cur_autopilot.title = "";
cur_autopilot.search_terms = "";
cur_autopilot.search_terms_date = "";
cur_autopilot.search_terms_title = "";
cur_autopilot.search_term_index = 0;
cur_autopilot.email = "";
cur_autopilot.campaign = "";
cur_autopilot.feed = "";
cur_autopilot.feed_video_only = 0;
cur_autopilot.service = -1;
cur_autopilot.schedule = new Array();
cur_autopilot.day_counts = "0,0,0,0,0,0,0";
cur_autopilot.email_0 = 0;
cur_autopilot.email_1 = 0;
cur_autopilot.email_2 = 0;
cur_autopilot.email_3 = 0;
cur_autopilot.email_4 = 0;
cur_autopilot.email_5 = 0;
cur_autopilot.email_6 = 0;
cur_autopilot.spredfast_company = 0;
cur_autopilot.spredfast_account = 0;
cur_autopilot.spredfast_initiative = 0;
cur_autopilot.spredfast_service = 0;
cur_autopilot.buffer_company = 0;
cur_autopilot.buffer_initiative = 0;
cur_autopilot.buffer_profiles = "";
cur_autopilot.buffer_profiles_split = new Array();
cur_autopilot.excluded_domains = "";

var categories_split = new Array();

var buffer = new Object();
buffer.buffer_key = "";
buffer.profiles = new Array();

var spredfast = new Object();
spredfast.spredfast_key = "";
spredfast.companies = new Array();
spredfast.initiatives = new Array();
spredfast.accounts = new Array();

var hyphen_re = /\u2011|\u2012|\u2013|\u2014|\u2015/gi;

var purchase_buttons;

var dirty = false;

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var pages = ["login_page","registration_page1","registration_page2","registration_page3","account_select","user_purchase","search_page", "bulk_submit_page", "bulk_submit_edit_schedule", "topic_page","autopilot_page","options_page", "notifications_page"];
var pages_login = ["login_page","registration_page1","registration_page2","registration_page3","account_select","user_purchase"];
var cur_page = "";
var buttons = ["home_button", "autopilots_button", "topics_button", "favourites_button", "history_button", "options_button", "notifications_button"];

var login_dest = "";

window.onload = function () {
	if (window.location.href.match(/login_dest=/)) {
		login_dest = window.location.href.slice(window.location.href.indexOf("login_dest=") + 11);
		console.log("login_dest: " + login_dest);
	}
	add_help_links();

	if (typeof(Storage) !== "undefined") {
		try {
			window.localStorage.setItem("test", 1);
			window.localStorage.removeItem("test");

			has_localstorage = true;
		}
		catch (error) {
			console.log("Storage error: " + JSON.stringify(error));
			reset_state();
		}
	} else {
		reset_state();
	}

	if (has_localstorage) {
		if (window.localStorage.getItem("state") !== "undefined" && window.localStorage.getItem("state") != null) {
			state = JSON.parse(window.localStorage.getItem("state"));
			if (state.version == version_id) {
				check_state();
			} else {
				reset_state();
			}
		} else {
			reset_state();
		}
	} else {
		reset_state();
	}
	//state.search_results = new Array();

	if (document.getElementById("search_entry")) {
		document.getElementById("search_entry").addEventListener("keyup", function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				do_search(document.getElementById('search_entry').value);
				return false;
			}
		});
	}
	if (document.getElementById("options_domain")) {
		document.getElementById("options_domain").addEventListener("keyup", function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				options_add_exclude(document.getElementById("options_domain").value);
				return false;
			}
		});
	}
	if (document.getElementById("easy_search_options_domain")) {
		document.getElementById("easy_search_options_domain").addEventListener("keyup", function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				options_add_exclude(document.getElementById("easy_search_options_domain").value);
				return false;
			}
		});
	}
	if (document.getElementById("easy_search_options_domain_autopilot")) {
		document.getElementById("easy_search_options_domain_autopilot").addEventListener("keyup", function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				options_add_exclude(document.getElementById("easy_search_options_domain_autopilot").value);
				return false;
			}
		});
	}
	if (license_key !== "" ) {
		if (state.regKey == "") {
			url = "https://www.mondoplayer.com/cgi-bin/registration_update.cgi";
			var requeststring = "regKey=" + license_key;
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("POST", url, false);
			xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlhttp.setRequestHeader("Accept", "application/json");
			xmlhttp.send(requeststring);

			var login_details = new Object;
			try {
				login_details = JSON.parse(xmlhttp.responseText);
				if (login_details.errorCode > 0) {
					return;
				}
				if (login_details.screenName != null) {
					screen_name = login_details.screenName;
				}

				state.regKey = login_details.regKey;
				state.isAccountSubscribed = login_details.isAccountSubscribed;
				state.isAccountTrial = login_details.isAccountTrial;
				state.accounts = login_details.accounts;
				state.accounts_update = true;
				save_state();
			}
			catch(e) {
				show_message("There was an error connecting to the MondoPlayer.com server.  Please try again later.", true, 0, "block");
				return;
			}
		}
		if (document.getElementById("right_panel_content") && state.search_results.length > 0) {
			draw_search_results(-1);
		}
		if (typeof edit_autopilot_id !== 'undefined') {
			edit_autopilot(edit_autopilot_id);
		}
		if (typeof autopilot_list !== 'undefined') {
			update_autopilots(true);
		}
		if (document.getElementById('topics_list') !== null) {
			draw_topics();
		}
		if (document.getElementById('playOnlyDuringWifi') !== null) {
			show_options();
		}

		if (typeof state.easy_search === "undefined" || state.easy_search == true) {
			open_easy_search("");
		} else if (typeof state.easy_search === "undefined" || state.easy_search == false) {
			open_advanced_search(0);
		}
		if (typeof edit_category_id !== 'undefined' && edit_category_id > 0) {
			show_autopilot_messages(edit_category_id);
		}
		update_notifications(false);
	}
	options_draw_trusted_domains();
	show_trusted_domain_posts();
	if (window.location.href.indexOf("mondoplayer_menu_autopilot_slug") > 0 && state.autopilots.list.length == 0) {
		show_confirm("Click Add New AutoPilot to create your first AutoPilot", add_new_autopilot, "Add New AutoPilot", true);
	}
}

function toggle_search_options() {
	if (document.getElementById("search_options").style.display == "none") {
		document.getElementById("search_options_label").innerHTML = "Default Search Order&nbsp;&nbsp;&nbsp;"
		document.getElementById("search_options").style.display = "inline-block";
	} else {
		document.getElementById("search_options_label").innerHTML = "Search Order"
		document.getElementById("search_options").style.display = "none";
		//document.getElementById("sort_by_date").checked = false;
		//document.getElementById("include_previously_posted").checked = false;
	}
}

function update_keywords() {
	if (Math.floor(Date.now() / 1000) - state.keywords.date > 3600) {
		state.keywords.date = Date.now() / 1000;
		var url = 'https://www.mondoplayer.com/cgi-bin/search.cgi?topics=1';

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();

		if (xmlhttp.responseText == "403") {
			console.log("update_keywords: 403");
			log_back_in();
			return;
		}

		state.keywords.list = new Array();
		var response_split = xmlhttp.responseText.split("\n");
		for (var i = 0; i < response_split.length; i++) {
			if (response_split[i].trim() != "") {
				state.keywords.list.push(response_split[i].trim());
			}
		}

		save_state();
	}
	remove_all_children(document.getElementById("topic_keyword_list"));

	for (var i = 0; i < state.keywords.list.length; i++) {
		var div = document.createElement("div");
		div.classList.add("topic_keyword_entry");
		div.style.marginTop = "4px";
		div.id = "keyword_" + state.keywords.list[i];
		div.setAttribute("keyword", state.keywords.list[i]);
		div.addEventListener("click", function(event) {
			topic_keyword_toggle(event);
		});

		var div_left = document.createElement("div");
		div_left.classList.add("topic_keyword_entry_left");
		div_left.id = "keyword_left_" + state.keywords.list[i];
		div_left.innerHTML = state.keywords.list[i];
		div_left.setAttribute("keyword", state.keywords.list[i]);

		div.appendChild(div_left);

		var div_right = document.createElement("div");
		div_right.classList.add("topic_keyword_entry_right");
		div_right.id = "keyword_right_" + state.keywords.list[i];
		div_right.setAttribute("keyword", state.keywords.list[i]);
		div_right.innerHTML = "+";

		div.appendChild(div_right);

		document.getElementById("topic_keyword_list").appendChild(div);
	}

	//remove_all_children(document.getElementById("autopilot_keyword_list"));

	//for (var i = 0; i < state.keywords.list.length; i++) {
	//	var div = document.createElement("div");
	//	div.classList.add("topic_keyword_entry");
	//	div.style.marginTop = "4px";
	//	div.id = "keyword2_" + state.keywords.list[i];
	//	div.setAttribute("keyword", state.keywords.list[i]);
	//	div.addEventListener("click", function(event) {
	//		autopilot_keyword_toggle(event);
	//	});
	//
	//	var div_left = document.createElement("div");
	//	div_left.classList.add("topic_keyword_entry_left");
	//	div_left.id = "keyword2_left_" + state.keywords.list[i];
	//	div_left.innerHTML = state.keywords.list[i];
	//	div_left.setAttribute("keyword", state.keywords.list[i]);
	//
	//	div.appendChild(div_left);
	//
	//	var div_right = document.createElement("div");
	//	div_right.classList.add("topic_keyword_entry_right");
	//	div_right.id = "keyword2_right_" + state.keywords.list[i];
	//	div_right.setAttribute("keyword", state.keywords.list[i]);
	//	div_right.innerHTML = "+";
	//
	//	div.appendChild(div_right);
	//
	//	document.getElementById("autopilot_keyword_list").appendChild(div);
	//}
}

function update_related_streams(force) {
	if (Math.floor(Date.now() / 1000) - state.related_streams.date > 3600 || force) {
		state.related_streams.date = Date.now() / 1000;
		var url = 'https://www.mondoplayer.com/cgi-bin/search.cgi?related_streams=1';

		var xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();

		if (xmlhttp.responseText == "403" || xmlhttp.responseText.match(/Permission Denied/)) {
			console.log("update_related_streams: 403");
			log_back_in();
			return;
		}

		state.related_streams.list = new Array();
		var response_split = xmlhttp.responseText.split("\n");
		for (var i = 0; i < response_split.length; i++) {
			if (response_split[i].trim() != "") {
				var stream = response_split[i].split(",");
				var stream_object = new Object();
				stream_object.score = stream[0];
				stream_object.age = stream[1];
				stream_object.title = stream[2];

				state.related_streams.list.push(stream_object);
			}
		}
		save_state();
	}
}

function show_autopilot_messages(category_id) {
	var found = false;
	for (var i = 0; i < state.autopilots.list.length; i++) {
		if (state.autopilots.list[i].categories == null || state.autopilots.list[i].categories == "") {
			continue;
		}
		if (category_id != -1) {
			var temp_categories = JSON.parse(state.autopilots.list[i].categories);
			var found_category = false;
			for (var c = 0; c < temp_categories.length; c++) {
				if (temp_categories[c].term_id == category_id) {
					found_category = true;
					break;
				}
			}
			if (found_category == false) {
				continue;
			}
		}
		if (state.autopilots.list[i].hashtags_string != null && state.autopilots.list[i].hashtags_string != "") {
			var cur_hashtags = JSON.parse(state.autopilots.list[i].hashtags_string);
			if (cur_hashtags.active) {
				found = true;
				break;
			}
		}
	}

	if (! found) {
		if (category_id == -1) {
			document.getElementById("autopilot_hashtag_message").innerHTML = "<p style='color: red'>There are no AutoPilots configured to automatically hashtag posts.</p>"
		} else {
			document.getElementById("autopilot_hashtag_message").innerHTML = "<p style='color: red'>There are no AutoPilots configured to automatically hashtag posts for this category.</p>"
		}
	} else {
		document.getElementById("autopilot_hashtag_message").innerHTML = "";
	}
}

function update_autopilots(force) {
	if (force || Math.floor(Date.now() / 1000) - state.autopilots.date > 3600) {
		state.autopilots.date = Date.now() / 1000;
		state.autopilots.list = autopilot_list.autopilots;
		save_state();
	}
}

function update_categories(prefix) {
	remove_all_children(document.getElementById(prefix + "_categories"));
	var opt = document.createElement("option");
	opt.text = "Select a Category for Posts...";
	opt.value = -1;
	document.getElementById(prefix + "_categories").options.add(opt);

	for (var i = 0; i < category_list.length; i++) {
		var opt = document.createElement("option");
		opt.text = category_list[i].name;
		opt.value = category_list[i].term_id;
		document.getElementById(prefix + "_categories").options.add(opt);
	}
	document.getElementById(prefix + "_categories").value = 1;
}

function update_users(prefix) {
	remove_all_children(document.getElementById(prefix + "_users"));
	var opt = document.createElement("option");
	opt.text = "Select an Author for Posts...";
	opt.value = -1;
	document.getElementById(prefix + "_users").options.add(opt);

	user_list.sort((a, b) => a.name.toLowerCase() >  b.name.toLowerCase() ? 1 : -1);

	for (var i = 0; i < user_list.length; i++) {
		var opt = document.createElement("option");
		opt.text = user_list[i].name;
		opt.value = user_list[i].user_id;
		document.getElementById(prefix + "_users").options.add(opt);
	}
	document.getElementById(prefix + "_users").value = -1;
}

function autopilot_add_categories() {
	if (document.getElementById('autopilot_categories').value == -1) {
		return;
	}
	var found = 0;
	for (var i = 0; i < categories_split.length; i++) {
		if (categories_split[i].term_id == document.getElementById('autopilot_categories').value) {
			found = 1;
			break;
		}
	}
	if (found == 0) {
		var popup_message = "";
		for (var i = 0; i < category_list.length; i++) {
			if (category_list[i].term_id == document.getElementById('autopilot_categories').value) { 
				if (category_list[i].pending == -1) {
					popup_message = "<div style='text-align: left;font-size: 18px'><b>Warning:</b> This Category is set to Draft mode. All posts will be in Draft Mode until they are Published in the Posts tab.</div>";
				} else if ( category_list[i].pending == 2) {
					popup_message = "<div style='text-align: left;font-size: 18px'><b>Warning:</b> This Category is set to Draft/Publish Trust mode. All posts will be in Draft Mode unless they come from a Trusted Source.</div>";
				}
				if (category_list[i].hide == 1) {
					popup_message = popup_message + "<div style='text-align: left;font-size: 18px;margin-top: 8px'><b>Category set to Hide in Main Vlog Roll:</b> Posts will not display in your vlog unless you create a menu link to this Category.</div>";
				}
				if (popup_message != "") {
					show_message(popup_message, true, 0, "block");
				}
				break;
			}
		}
		var new_category = {"term_id":document.getElementById('autopilot_categories').value,"name":document.getElementById('autopilot_categories').options[document.getElementById('autopilot_categories').selectedIndex].text}
		categories_split.push(new_category);
	}
	autopilot_draw_categories();
}

function autopilot_remove_categories(term_id) {
	for (var i = 0; i < categories_split.length; i++) {
		if (categories_split[i].term_id == term_id) {
			categories_split.splice(i, 1);
			break;
		}
	}
	autopilot_draw_categories();
}

function autopilot_draw_categories() {
	remove_all_children(document.getElementById("autopilot_selected_categories"));

	var report = "";
	for (var i = 0; i < categories_split.length; i++) {
		report = report + "<div class='tag tag_small tag_grey topic_button_selected' onclick='autopilot_remove_categories(" + categories_split[i].term_id + ")'>" +  categories_split[i].name + "</div>";
	}
	if (report == "") {
		document.getElementById("autopilot_selected_categories").style.display = "none";
	} else {
		document.getElementById("autopilot_selected_categories").style.display = "block";
		document.getElementById("autopilot_selected_categories").innerHTML = report;
	}
	if (categories_split.length > 0) {
		var slug = "";
		var feed_url = "";
		for (var i = 0; i < category_list.length; i++) {
			if (category_list[i].term_id == categories_split[0].term_id) {
				slug = category_list[i].slug;
				break;
			}
		}
		if (slug != "") {
			feed_url_with_hashtags = location.protocol + "//" + location.hostname + "/category/" + slug + "/feed/?hashtags";
			document.getElementById("autopilot_hashtags_droplet_feed_url").innerHTML = "<input type='text' id='autopilot_hashtags_droplet_feed_url_text' value='" + feed_url_with_hashtags + "' style='width: 100%;max-width: 700px;font-size: 16px' readonly /> <input type='button' value='Copy' onclick='copy_url(\"autopilot_hashtags_droplet_feed_url_text\")' />";
			document.getElementById("autopilot_hashtags_droplet_feed_description_url").innerHTML = "<input type='text' id='autopilot_hashtags_droplet_feed_description_url_text' value='" + feed_url_with_hashtags + "_with_description' style='width: 100%;max-width: 700px;font-size: 16px' readonly /> <input type='button' value='Copy' onclick='copy_url(\"autopilot_hashtags_droplet_feed_description_url_text\")' />";
		} else {
			document.getElementById("autopilot_hashtags_droplet_feed_url").innerHTML = "--";
			document.getElementById("autopilot_hashtags_droplet_feed_description_url").innerHTML = "--";
		}
	} else {
		document.getElementById("autopilot_hashtags_droplet_feed_url").innerHTML = "--";
		document.getElementById("autopilot_hashtags_droplet_feed_description_url").innerHTML = "--";
	}

}
function copy_url(source) {
	const input = document.getElementById(source);
	input.select();
	input.setSelectionRange(0,99999);
	document.execCommand("copy");
}

function bulk_submit_add_categories() {
	if (document.getElementById('bulk_submit_categories').value == -1) {
		return;
	}
	var found = 0;
	for (var i = 0; i < categories_split.length; i++) {
		if (categories_split[i].term_id == document.getElementById('bulk_submit_categories').value) {
			found = 1;
			break;
		}
	}
	if (found == 0) {
		for (var i = 0; i < category_list.length; i++) {
			if (category_list[i].term_id == document.getElementById('bulk_submit_categories').value && (category_list[i].pending == -1 || category_list[i].pending == 2)) {
				show_message("Posts included in this category will be created as 'draft'. You will need to visit the Posts page to publish them.", true, 0, "block");
				break;
			}
		}
		var new_category = {"term_id":document.getElementById('bulk_submit_categories').value,"name":document.getElementById('bulk_submit_categories').options[document.getElementById('bulk_submit_categories').selectedIndex].text}
		categories_split.push(new_category);
	}
	bulk_submit_draw_categories();
}

function bulk_submit_remove_categories(term_id) {
	for (var i = 0; i < categories_split.length; i++) {
		if (categories_split[i].term_id == term_id) {
			categories_split.splice(i, 1);
			break;
		}
	}
	bulk_submit_draw_categories();
}

function bulk_submit_draw_categories() {
	remove_all_children(document.getElementById("bulk_submit_selected_categories"));

	var report = "";
	for (var i = 0; i < categories_split.length; i++) {
		report = report + "<div class='tag tag_small tag_grey topic_button_selected' onclick='bulk_submit_remove_categories(" + categories_split[i].term_id + ")'>" +  categories_split[i].name + "</div>";
	}
	document.getElementById("bulk_submit_selected_categories").innerHTML = report;
}

function update_topics(force) {
	if (force || Math.floor(Date.now() / 1000) - state.topics.date > 3600) {
		var url = 'https://www.mondoplayer.com/cgi-bin/search_notification.cgi';
		var requeststring = "id=" + license_key + "&fetch_alerts=1";

		var xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("POST", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send(requeststring);

		if (xmlhttp.responseText == "1") {
			show_message("There was an error loading the topics.  Please try again", true, 0, "block");
			return;
		} else if (xmlhttp.responseText == "403") {
			console.log("update_topics: 403");
			log_back_in();
			return;
		}

		try {
			state.topics.list = JSON.parse(xmlhttp.responseText);
			state.topics.date = Date.now() / 1000;
			save_state();
		}
		catch(e) {
			console.log(e.message);
			show_message("There was an error loading the Saved Searches.  Please try again", true, 0, "block");
			return;
		}
	}

	for (var i in state.topics.list) {
		if (! state.topics.list.hasOwnProperty(i)) {
			continue;
		}

		if (typeof state.topics.list[i].hashtags === "undefined") {
			state.hashtags[state.topics.list[i].alert_id] = new Array(); 
		} else {
			state.hashtags[state.topics.list[i].alert_id] = state.topics.list[i].hashtags;
		}
	}
}

function update_favourites(force) {
	if (force || Math.floor(Date.now() / 1000) - state.favourites.date > 3600) {
		var url = 'https://www.mondoplayer.com/cgi-bin/search.cgi?get_favourites=1';

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();

		if (xmlhttp.responseText == "403" || xmlhttp.responseText.match(/Permission Denied/)) {
			console.log("update_favourites: 403");
			log_back_in();
			return;
		}

		state.favourites.list = new Array();
		var response_split = xmlhttp.responseText.split("\n");
		for (var i = 0; i < response_split.length; i++) {
			if (response_split[i].trim() != "") {
				state.favourites.list.push(response_split[i].trim().toUpperCase());
			}
		}
		state.favourites.date = Date.now() / 1000;
		save_state();

	}
}

function update_options(force) {
	if (force || Math.floor(Date.now() / 1000) - state.options.date > 3600) {
		var url = 'https://www.mondoplayer.com/cgi-bin/account.cgi';
		var requeststring = "id=" + license_key + "&get_options=1";

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send(requeststring);

		if (xmlhttp.responseText == "403") {
			console.log("update_options: 403");
			log_back_in();
			return;
		}

		try {
			var options = JSON.parse(xmlhttp.responseText);
			state.options.emailFlag = options[0].emailFlag;
			state.options.playOnlyDuringWifi = options[0].playOnlyDuringWifi;
			state.options.playDuringRoaming = options[0].playDuringRoaming;
			state.options.onlyPostVideosWithThumbnails = options[0].onlyPostVideosWithThumbnails;
			if (typeof ignore_original_tags !== "undefined" ) {
				state.options.ignore_original_tags = ignore_original_tags;
			}
			state.options.notification = options[0].notification;
			state.options.excluded_domains = options[0].excluded_domains;
			state.options.email = options[0].userid;
			state.options.content_filters = options[0].content_filters;
			state.options.trusted_domains = options[0].trusted_domains;
			state.options.excluded_search_terms = options[0].excluded_search_terms;
			state.options.excluded_youtube = options[0].excluded_youtube;

			state.options.date = Date.now() / 1000;
			save_state();
		}
		catch(e) {
			show_message("There was an error loading the Options.  Please try again", true, 0, "block");
			return;
		}
	}
}

function update_screen_name() {
	state.screen_name = screen_name;
}
function update_services(force) {
	if (force || Math.floor(Date.now() / 1000) - state.services.date > 3600) {
		var url = 'https://www.mondoplayer.com/cgi-bin/bulk_submit.cgi';
		var requeststring = "id=" + license_key + "&get_services=1&wp=1"

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send(requeststring);

		if (xmlhttp.responseText == "403") {
			console.log("update_services: 403");
			log_back_in();
			return;
		}
		if (xmlhttp.responseText == "1") {
			console.log("update_services: 1");
			log_back_in();
			return;
		}

		try {
			state.services.list = JSON.parse(xmlhttp.responseText);
			if (typeof is_turnkey !== "undefined" && is_turnkey) {
				for (var i = 0; i < state.services.list.services.length; i++) {
					if (state.services.list.services[i].service_name == "WordPress") {
						state.services.list.services[i].service_name = "Vlog";
					}
				}
			}
			state.services.date = Date.now() / 1000;
			save_state();
		}
		catch(e) {
			console.log(e.message);
			show_message("There was an error loading the services.  Please try again", true, 0, "block");
			return;
		}
	}
}

function save_fields() {
	var url = 'https://www.mondoplayer.com/cgi-bin/bulk_submit.cgi'; var requeststring = "id=" + license_key + "&save_fields=" + encodeURIComponent(JSON.stringify(state.services.list.fields[0]));

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("save_fields: 403");
		log_back_in();
		return;
	}
}

var dirtyfunc;
var dirtyparam;
function show_dirty(func, param) {
	dirtyfunc = func;
	dirtyparam = param;
	var message = "<p style='margin-top: 0'>Changes you made have not been saved</p><p style='text-align: right; margin-bottom: 0'><input type='button' value='Leave' onclick='leave_dirty()' class='form_submit_btn_light' style='margin-left: 4px ;display:inline-block' /> <input type='button' value='Stay' onclick='hide_message()' class='form_submit_btn_light' style='margin-left: 4px;display:inline-block' /></p>"
	show_message(message, true, 0, "none");
}
function leave_dirty() {
	dirty = false;
	dirtyfunc(dirtyparam);
}

function show_page(page_name) {
	clear_shake_error(document.getElementById(page_name));

	if (dirty) {
		show_dirty(show_page, page_name);
		return;
	}

	document.getElementById("right_panel_new_search").style.display = "none";
	document.getElementById("right_panel_new_search_notify").style.display = "none";
	document.getElementById("right_panel_suggestions").style.display = "none";
	//document.getElementById("autopilots_content").style.display = "none";
	//document.getElementById("topics_content").style.display = "none";
	//document.getElementById("menu_registration").style.display = "block";

	cur_page = page_name
	//for (var i = 0; i < pages.length; i++) {
	//	if (pages[i] == page_name ) {
	//		document.getElementById(pages[i]).style.display = "block";
	//	} else {
	//		document.getElementById(pages[i]).style.display = "none";
	//	}
	//}
	if (pages_login.includes(page_name)) {
		document.getElementById("search_page").style.display = "none";
	} else {
		document.getElementById("search_page").style.display = "block";
	}
	if (page_name == "search_page") {
		document.getElementById("right_panel_search_page").style.display = "block";
	} else {
		document.getElementById("right_panel_search_page").style.display = "none";
	}
	if (page_name == "login_page") {
		document.getElementById("menu_registration").style.display = "none";
	}
	if (page_name == "registration_page1") {
		document.getElementById("menu_registration").style.display = "none";
		if (state.country == "CA") {
			document.getElementById("notification_reg").checked = false;
			document.getElementById("emailFlag_reg").checked = false;
		} else {
			document.getElementById("notification_reg").checked = true;
			document.getElementById("emailFlag_reg").checked = true;
		}
	}
	if (page_name == "registration_page2") {
		document.getElementById("menu_registration").style.display = "none";
		update_keywords();
		cur_topic.allow_notification = state.allow_notification;
		cur_topic.allow_email = state.options.emailFlag;
		if (state.options.notification == 1) {
			document.getElementById("notifify_me_button").classList.remove("form_button_unselected");
			document.getElementById("notifify_me_button").classList.add("form_button_selected");
			document.getElementById("notifify_me_button").value="Notify Me \u25CF" ;
		} else {
			document.getElementById("notifify_me_button").classList.add("form_button_unselected");
			document.getElementById("notifify_me_button").classList.remove("form_button_selected");
			document.getElementById("notifify_me_button").value="Notify Me \u25CB" ;
		}
		if (state.options.emailFlag == 1) {
			document.getElementById("email_me_button").classList.remove("form_button_unselected");
			document.getElementById("email_me_button").classList.add("form_button_selected");
			document.getElementById("email_me_button").value="Email Me \u25CF" ;

		} else {
			document.getElementById("email_me_button").classList.add("form_button_unselected");
			document.getElementById("email_me_button").classList.remove("form_button_selected");
			document.getElementById("email_me_button").value="Email Me \u25CB" ;
		}
		draw_search_terms();
		draw_schedules();
	}

	//document.getElementById(page_name).scrollTop = 0;
	//document.getElementById("agency_dashboard_title").style.display = "none";
	//document.getElementById("agency_dashboard_buttons").style.display = "none";
	//if (page_name == "account_select") {
	//	document.getElementById("menu_registration").style.display = "none";
	//	document.getElementById("agency_dashboard_title").style.display = "block";
	//	document.getElementById("agency_dashboard_buttons").style.display = "block";
	//	if (state.accounts.length < 1) {
	//		show_page("search_page");
	//		return;
	//	}
	//	draw_accounts();
	//}
	if (page_name == "search_page") {
		if (typeof state.easy_search === "undefined" || state.easy_search == true) {
			open_easy_search("");
		} else {
			open_advanced_search(0);
		}
		show_home(false);
		if (state.search_results.length > 0) {
			draw_search_results(-1);
			document.getElementById("right_panel_suggestions").style.display = "none";
		}
		set_show_approved_button_state();
	}
}

function toggle_login_form(state) {
	if ((document.getElementById("country_field_wrapper").style.display == "block" && state == 0) || state == 1) {
		document.getElementById("country_field_wrapper").style.display = "none";
		document.getElementById("login_form_header").innerHTML = "Sign in";
		document.getElementById("login_button").value = "Sign in";
		document.getElementById("toggle_login").innerHTML = "Create an account";
	} else {
		document.getElementById("country_field_wrapper").style.display = "block";
		document.getElementById("login_form_header").innerHTML = "Create an Account";
		document.getElementById("login_button").value = "Sign Up";
		document.getElementById("toggle_login").innerHTML = "Sign in";
	}
	document.getElementById("login_form").style.display = "block";
	document.getElementById("recover_password_form").style.display = "none";
	document.getElementById("username_error").style.display = "none";
	document.getElementById("password_error").style.display = "none";
	document.getElementById("login_error").style.display = "none";
	clear_shake_error(document.getElementById("login_form"));
}

function open_login() {
	if (state.isLoggedIn) {
		show_page("search_page");
	} else {
		show_page("login_page");
	}
}

function login() {
	if (busy) {
		return;
	}
	var is_registration = false;

	busy = true;
	document.getElementById("login_error").style.display = "none";

	var validate = true;
	if (! document.getElementById("username").value.trim().match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) {
		validate = false;
		document.getElementById("username_error").innerHTML="Not a valid email address";
		document.getElementById("username_error").style.display = "block";
	} else {
		document.getElementById("username_error").style.display = "none";
	}
	if (document.getElementById("password").value.trim().length < 6) {
		validate = false;
		document.getElementById("password_error").innerHTML="Password must be at least 6 characters";
		document.getElementById("password_error").style.display = "block";
	} else {
		document.getElementById("password_error").style.display = "none";
	}

	if (validate == false) {
		shake_error(document.getElementById("login_form"));
		busy = false;
	} else {
		clear_shake_error(document.getElementById("login_form"));
		url = "https://www.mondoplayer.com/cgi-bin/registration_update.cgi";

		var requeststring = "v=2&email=" + document.getElementById("username").value.trim() + "&password=" + document.getElementById("password").value.trim() + "&wp_site=" + encodeURIComponent(wp_site);

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.setRequestHeader("Accept", "application/json");
		xmlhttp.send(requeststring);

		var login_details = new Object;
		try {
			login_details = JSON.parse(xmlhttp.responseText);
			if (login_details.errorCode > 0 && ! is_registration) {
				var element = document.getElementById("login_error");
				element.style.display = "block";
				element.innerHTML = "Invalid email address or password. <br />Lost your password?  <br /><span class='text_link' onclick='open_recover_password()'>Recover Password</span>";
				shake_error(document.getElementById("login_form"));

				busy = false;
				return;
			} else if (login_details.errorCode > 0) {
				var element = document.getElementById("login_error");
				if (xmlhttp.responseText.match(/Email/i)) {
					element = document.getElementById("username_error");
				}

				element.style.display = "block";
				element.innerHTML = login_details.errorMessage;
				shake_error(document.getElementById("login_form"));

				busy = false;
				return;
			}

			var screen_name = "";
			if (login_details.screenName != null) {
				screen_name = login_details.screenName;
			}

			license_key = login_details.regKey;
			state.regKey = login_details.regKey;
			state.isAccountSubscribed = login_details.isAccountSubscribed;
			state.isAccountTrial = login_details.isAccountTrial;
			state.accounts = login_details.accounts;
			state.accounts_update = true;
			save_state();

			requeststring = "action=mondoplayer&form=registration&mondoplayer_license_key=" + login_details.regKey + "&mondoplayer_is_subscribed=" + login_details.isAccountSubscribed + "&mondoplayer_is_trial=" + login_details.isAccountTrial + "&mondoplayer_screen_name=" + screen_name + "&mondoplayer_is_mastermind=" + login_details.is_mastermind + "&mondoplayer_userid=" + document.getElementById("username").value.trim();
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("POST", admin_post_url, false);
			xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlhttp.setRequestHeader("Accept", "application/json");
			xmlhttp.send(requeststring);

			clear_shake_error(document.getElementById("login_form"));
			busy = false;

			state.isLoggedIn = true;
			save_state();
			window.location.reload();
			return;
		} catch(e) {
			console.log(JSON.stringify(e));
			show_message("There was an error logging in. Please try again", true, 0, "block");
			busy = false;
			return;
		}
	}
}

function mastermind_redirect(slug) {
	var requeststring = "action=mondoplayer&form=mastermind_redirect&mastermind_redirect=" + slug;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			hide_busy();
			if (this.status == 200) {
				console.log("redirect: " + xmlhttp.responseText);
				var location = JSON.parse(xmlhttp.responseText);
				window.open(location, "mastermind");
			} else {
				console.log("save_autopilot error: " + this.status);
				show_message("There was an error connecting to MondoPlayer, please try again", true, 0, "block");
			}
		}
	};
	xmlhttp.open("POST", admin_post_url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "application/json");
	xmlhttp.send(requeststring);
	show_busy("Opening MasterMind...");
}

function open_recover_password() {
	document.getElementById("login_form").style.display = "none";
	document.getElementById("recover_password_form").style.display = "block";
	document.getElementById("login_form_header").innerHTML = "Recover Password";
}

function recover_password() {
	if (! document.getElementById("recover_password_email").value.trim().match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) {
		validate = false;
		document.getElementById("recover_password_error").innerHTML="Not a valid email address";
		document.getElementById("recover_password_error").style.display = "block";
		shake_error(document.getElementById("recover_password_form"));
		return;
	} else {
		document.getElementById("recover_password_error").style.display = "none";
	}

	var url = "https://www.mondoplayer.com/cgi-bin/recoverpassword.cgi?email=" + document.getElementById("recover_password_email").value.trim();
	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();

	if (xmlhttp.responseText == "1") {
		show_message("There was an sending the recovery email.  Please try again", true, 0, "block");
		return;
	}

	toggle_login_form(1);
	show_message("Check your email to reset your password.", true, 0, "block");
}

function regstration_page1() {
	if (busy) {
		return;
	}
	busy = true;
	if (document.getElementById("agreement").checked == false) {
		document.getElementById("registration1_error").innerHTML = "You must agree to the Licence Agreement before continuing";
		document.getElementById("registration1_error").style.display="block";
		shake_error(document.getElementById("registration_page1_form"));

		busy = false;
		return;
	}

	clear_shake_error(document.getElementById("registration_page1_form"));

	var url = "https://www.mondoplayer.com/cgi-bin/account.cgi";

	state.options.playOnlyDuringWifi = 0;
	if (document.getElementById("playOnlyDuringWifi_reg").checked) {
		state.options.playOnlyDuringWifi = 1;
	}
	state.options.playDuringRoaming = 0;
	if (document.getElementById("playDuringRoaming_reg").checked) {
		state.options.playDuringRoaming = 1;
	}
	state.options.onlyPostVideosWithThumbnails = 0;
	if (document.getElementById("onlyPostVideosWithThumbnails_reg").checked) {
		state.options.onlyPostVideosWithThumbnails = 1;
	}
	state.options.ignore_original_tags = 0;
	state.options.emailFlag = 0;
	if (document.getElementById("emailFlag_reg").checked) {
		state.options.emailFlag = 1;
	}
	state.options.notification = 0;
	if (document.getElementById("notification_reg").checked) {
		state.options.notification = 1;
	}

	var requeststring = "id=" + license_key + "&playOnlyDuringWifi=" + state.options.playOnlyDuringWifi + "&playDuringRoaming=" + state.options.playDuringRoaming + "&onlyPostVideosWithThumbnails=" + state.options.onlyPostVideosWithThumbnails + "&ignore_original_tags=" + state.options.ignore_original_tags + "&emailFlag=" + state.options.emailFlag + "&notification=" + state.options.notification;

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("regstration_page1: 403");
		log_back_in();
		busy = false;
		return;
	}

	if (xmlhttp.responseText == "1") {
		document.getElementById("registration1_error").innerHTML = "There was an error saving your settings, please try again.";
		document.getElementById("registration1_error").style.display = "block"
		shake_error(document.getElementById("registration_page1_form"));

		busy = false;
		return;
	}

	clear_shake_error(document.getElementById("registration_page1_form"));

	state.isAccountSubscribed = 0;
	state.isAccountTrial = 1;
	state.isLoggedIn = true;
	state.accounts = new Array();
	state.accounts_update = false;

	save_state();

	busy = false;
	document.getElementById("registration_page1").style.display = "none";
	document.getElementById("registration_page3").style.display = "block";
}

function draw_accounts() {
	remove_all_children(document.getElementById("account_table"));

	update_accounts();

	if (state.screen_name == "") {
		update_screen_name();
	}
	var div = document.createElement("div");
	document.getElementById("account_table").appendChild(div);
	div.innerHTML = "<table style='width: 100%;padding-left: 15px;padding-right: 95px;border-bottom: 1px solid #999'><tr><td style='width: 250px'><b>Screen Name</b></td><td><b>Email</b></td><td style='width: 90px'><b>AutoPilots</b></td></tr></table>";
	for (var i = 0; i < state.accounts.length; i++) {
		if (state.accounts[i].agency_account == 1) {
			continue;
		}
		if (state.accounts[i].screen_name == state.screen_name) {
			document.getElementById("menu_change_user").innerHTML = "Account: " + state.screen_name;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");
		div.style.backgroundColor = "#eee";
		var title = document.createElement("div");
		title.classList.add("feed_entry_title");
		var autopilot_limit = 5 + (state.accounts[i].autopilot_limit * 5);
		var userid = state.accounts[i].userid;
		if (userid.match(/client.mondoplayer.com/)) {
			userid = "";
		}
		title.innerHTML = "<table style='width: 100%'><tr><td style='width: 250px'>" + state.accounts[i].screen_name + "</td><td>" + userid + "</td><td style='width: 90px'>" + state.accounts[i].autopilot_count + " of " + autopilot_limit + "</td></tr></table>";
		div.appendChild(title);
		var select = document.createElement("div");
		select.classList.add("feed_entry_edit");
		select.innerHTML = "Select";
		select.style.width = "90px";
		select.setAttribute("account", i);
		div.addEventListener("click", function(event) {
			select_account(event);
		});

		div.appendChild(select);
		document.getElementById("account_table").appendChild(div);
	}
	document.getElementById("dashboard").style.display = "none";
	document.getElementById("add_account").style.display = "block";
	document.getElementById("buy_autopilots").style.display = "block";

	document.getElementById("menu_change_user").style.display = "block";
	document.getElementById("menu_home").style.display = "block";
}

function update_purchase_buttons() {
	if (typeof purchase_buttons == "undefined") {

		var url = "wp.php?buttons=1";

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();

		if (xmlhttp.responseText == "403") {
			console.log("regstration_page1: 403");
			log_back_in();
			busy = false;
			return;
		}

		purchase_buttons = JSON.parse(xmlhttp.responseText);
	}
}

function buy_autopilots() {
	remove_all_children(document.getElementById("account_table"));
	login_dest = "";

	if (state.screen_name == "") {
		update_screen_name();
	}

	if (state.accounts.length == 0) {
		update_accounts();
	}

	update_purchase_buttons();

	if (state.accounts.length < 2) {
		var autopilot_limit = 5 + (state.accounts[0].autopilot_limit * 5);

		document.getElementById("user_purchase_div").innerHTML = "<h2>Purchase Additional AutoPilots&nbsp;&nbsp;&nbsp;<input type='button' value='Cancel' class='form_submit_btn_light' style='display: inline-block' onclick='draw_accounts()' /></h2><p style='text-align:center'>Currently using " + state.accounts[0].autopilot_count + " of " + autopilot_limit + ' autopilots</p><div style="text-align: center"><form style="display: inline-block" id="edd_purchase_' + purchase_buttons.autopilot_monthly.product_id + '_0_0" class="edd_download_purchase_form edd_purchase_' + purchase_buttons.autopilot_monthly.product_id + '" method="post"><div class="edd_purchase_submit_wrapper"><input onclick="purchase_autopilot(0, ' + purchase_buttons.autopilot_monthly.product_id + ', 0)" type="button" class="edd-add-to-cart edd-no-js button blue edd-submit" name="edd_purchase_download" value="Monthly&nbsp;–&nbsp;$' + purchase_buttons.autopilot_monthly.price + '" data-action="edd_add_to_cart" data-download-id="' + purchase_buttons.autopilot_monthly.product_id + '" data-variable-price="no" data-price-mode="single"></div><input type="hidden" name="download_id" value="' + purchase_buttons.autopilot_monthly.product_id + '"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"><input type="hidden" name="edd_redirect_to_checkout" id="edd_redirect_to_checkout" value="1"></form> <form style="display: inline-block" id="edd_purchase_' + purchase_buttons.autopilot_yearly.product_id + '_0_1" class="edd_download_purchase_form edd_purchase_' + purchase_buttons.autopilot_yearly.product_id + '" method="post"><div class="edd_purchase_submit_wrapper"><input onclick="purchase_autopilot(0, ' + purchase_buttons.autopilot_monthly.product_id + ', 0)" type="button" class="edd-add-to-cart edd-no-js button blue edd-submit" name="edd_purchase_download" value="Yearly&nbsp;–&nbsp;$' + purchase_buttons.autopilot_yearly.price + '" data-action="edd_add_to_cart" data-download-id="' + purchase_buttons.autopilot_yearly.product_id + '" data-variable-price="no" data-price-mode="single"></div><input type="hidden" name="download_id" value="' + purchase_buttons.autopilot_yearly.product_id + '"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"><input type="hidden" name="edd_redirect_to_checkout" id="edd_redirect_to_checkout" value="1"></form></div>';
		show_page("user_purchase");

		return;
	}

	var div = document.createElement("div");
	div.innerHTML = "<h2>Purchase Additional AutoPilots&nbsp;&nbsp;&nbsp;<input type='button' value='Cancel' class='form_submit_btn_light' style='display: inline-block' onclick='draw_accounts()' /></h2><table style='width: 100%;padding-left: 15px;padding-right: 95px;border-bottom: 1px solid #999'><tr><td style='width: 200px'><b>Screen Name</b></td><td style='width: 100px'><b>AutoPilots</b></td><td style='width: 320px'</tr></table>";
	document.getElementById("account_table").appendChild(div);

	for (var i = 0; i < state.accounts.length; i++) {
		if (state.accounts[i].agency_account == 1) {
			continue;
		}
		if (state.accounts[i].screen_name == state.screen_name) {
			document.getElementById("menu_change_user").innerHTML = "Account: " + state.screen_name;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");
		var title = document.createElement("div");
		title.classList.add("feed_entry_title");
		var autopilot_limit = 5 + (state.accounts[i].autopilot_limit * 5);

		var buttons;

		if (state.accounts[i].autopilot_limit_flag == 0) {
			buttons = '<form style="display: inline-block" id="edd_purchase_' + purchase_buttons.autopilot_monthly.product_id + '_' + i + '_0" class="edd_download_purchase_form edd_purchase_' + purchase_buttons.autopilot_monthly.product_id + '" method="post"><div class="edd_purchase_submit_wrapper"><input onclick="purchase_autopilot(' + i + ', ' + purchase_buttons.autopilot_monthly.product_id + ', 0)" type="button" class="edd-add-to-cart edd-no-js button blue edd-submit" name="edd_purchase_download" value="Monthly&nbsp;–&nbsp;$' + purchase_buttons.autopilot_monthly.price + '" data-action="edd_add_to_cart" data-download-id="' + purchase_buttons.autopilot_monthly.product_id + '" data-variable-price="no" data-price-mode="single"></div><input type="hidden" name="download_id" value="' + purchase_buttons.autopilot_monthly.product_id + '"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"><input type="hidden" name="edd_redirect_to_checkout" id="edd_redirect_to_checkout" value="1"></form> <form style="display: inline-block" id="edd_purchase_' + purchase_buttons.autopilot_yearly.product_id + '_' + i + '_1" class="edd_download_purchase_form edd_purchase_' + purchase_buttons.autopilot_yearly.product_id + '" method="post"><div class="edd_purchase_submit_wrapper"><input onclick="purchase_autopilot(' + i + ', ' + purchase_buttons.autopilot_monthly.product_id + ', 0)" type="button" class="edd-add-to-cart edd-no-js button blue edd-submit" name="edd_purchase_download" value="Yearly&nbsp;–&nbsp;$' + purchase_buttons.autopilot_yearly.price + '" data-action="edd_add_to_cart" data-download-id="' + purchase_buttons.autopilot_yearly.product_id + '" data-variable-price="no" data-price-mode="single"></div><input type="hidden" name="download_id" value="' + purchase_buttons.autopilot_yearly.product_id + '"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"><input type="hidden" name="edd_redirect_to_checkout" id="edd_redirect_to_checkout" value="1"></form>';
		} else {
			buttons = "Contact MondoPlayer at <a href='mailto:info@mondoplayer.com'>info@mondoplayer.com</a>";
		}

		title.innerHTML = "<table style='width: 100%;padding-right: 95px'><tr><td style='width: 200px'>" + state.accounts[i].screen_name + "</td><td style='width: 100px'>" + state.accounts[i].autopilot_count + " of " + autopilot_limit + "</td><td style='width: 320px'>" + buttons + "</td></tr></table>";
		div.appendChild(title);
		document.getElementById("account_table").appendChild(div);
	}

	document.getElementById("dashboard").style.display = "block";
	document.getElementById("add_account").style.display = "block";
	document.getElementById("buy_autopilots").style.display = "none";


	document.getElementById("menu_change_user").style.display = "block";
	document.getElementById("menu_home").style.display = "block";
}

function purchase_autopilot(i, product_id, source) {
	state.accounts_update = false;

	save_state();

	var url = "wp.php?purchase_autopilot=" + encodeURIComponent(state.accounts[i].userid);

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();

	//document.getElementById("edd_purchase_" + product_id + "_" + i + "_" + source).submit();
}

function update_accounts() {
	var url = "https://www.mondoplayer.com/cgi-bin/account.cgi?get_accounts=1";

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();


	state.accounts = JSON.parse(xmlhttp.responseText);
	state.accounts_update = true;

	//draw_accounts();
}

function add_account() {
	remove_all_children(document.getElementById("account_table"));

	update_purchase_buttons();

	var div = document.createElement("div");

	var monthly = '<form action="/checkout/" style="display: inline-block" id="edd_purchase_user_monthly" class="edd_download_purchase_form edd_purchase_' + purchase_buttons.user_monthly.product_id + '" method="post"><div class="edd_purchase_submit_wrapper"><input onclick="purchase_user(' + purchase_buttons.user_monthly.product_id + ', 0)" type="button" class=" edd-no-js button blue" name="edd_purchase_download" value="Monthly&nbsp;–&nbsp;$' + purchase_buttons.user_monthly.price + '" data-action="edd_add_to_cart" data-download-id="' + purchase_buttons.user_monthly.product_id + '" data-variable-price="no" data-price-mode="single"></div><input type="hidden" name="download_id" value="' + purchase_buttons.user_monthly.product_id + '"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"><input type="hidden" name="edd_redirect_to_checkout" id="edd_redirect_to_checkout" value="1"></form>';
	var yearly = '<form action="/checkout/" style="display: inline-block" id="edd_purchase_user_yearly" class="edd_download_purchase_form edd_purchase_' + purchase_buttons.user_yearly.product_id + '" method="post"><div class="edd_purchase_submit_wrapper"><input onclick="purchase_user(' + purchase_buttons.user_yearly.product_id + ', 1)" type="button" class=" edd-no-js button blue" name="edd_purchase_download" value="Yearly&nbsp;–&nbsp;$' + purchase_buttons.user_yearly.price + '" data-action="edd_add_to_cart" data-download-id="' + purchase_buttons.user_yearly.product_id + '" data-variable-price="no" data-price-mode="single"></div><input type="hidden" name="download_id" value="' + purchase_buttons.user_yearly.product_id + '"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"><input type="hidden" name="edd_redirect_to_checkout" id="edd_redirect_to_checkout" value="1"></form>';

	div.innerHTML = "<h2>Purchase Additional Account&nbsp;&nbsp;&nbsp;<input type='button' value='Cancel' class='form_submit_btn_light' style='display: inline-block' onclick='draw_accounts()' /></h2><p>Enter Name for Account: <input type='text' id='new_screen_name' />&nbsp;&nbsp;<span id='new_screen_name_message' style='color: red'></span></p><div style='text-align: center'>" + monthly + " " + yearly + "</div>";

	document.getElementById("account_table").appendChild(div);
	document.getElementById("dashboard").style.display = "block";
	document.getElementById("add_account").style.display = "none";
	document.getElementById("buy_autopilots").style.display = "block";

}

function purchase_user(product_id, term) {
	var period = "monthly";
	if (term == 1) {
		preiod = "yearly";
	}

	if (document.getElementById("new_screen_name").value.trim() == "") {
		document.getElementById("new_screen_name_message").innerHTML = "Choose a Name";
		return;
	}

	state.accounts_update = false;

	save_state();

	var url = "wp.php?purchase_screen_name=" + encodeURIComponent(document.getElementById("new_screen_name").value);

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();

	var test = JSON.parse(xmlhttp.responseText);

	if (test.errorCode > 0) {
		document.getElementById("new_screen_name_message").innerHTML = "Name Unavailable";
	} else {
		document.getElementById("new_screen_name_message").innerHTML = "";
		document.getElementById("edd_purchase_user_" + period).submit();
	}
}

function select_account(e) {
	var account = state.accounts[e.target.getAttribute("account")];

	var url = "https://www.mondoplayer.com/cgi-bin/registration_update.cgi?web=1&select_account=" + encodeURIComponent(account.userid);

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();

	if (xmlhttp.responseText == "1") {
		show_message("There was an error switching accounts.  Please try again", true, 0, "block");
		return;
	} else if (xmlhttp.responseText == "403") {
		console.log("select_account: 403");
		log_back_in();
		return;
	} else if (xmlhttp.responseText != account.userid) {
		show_message("There was an error switching accounts.  Please try again", true, 0, "block");
		return;
	}

	state.screen_name = account.screen_name;

	document.getElementById("menu_change_user").innerHTML = "Account: " + account.screen_name;

	state.topics.date = 0;
	state.autopilots.date = 0;
	state.services.date = 0;
	update_keywords(true);

	show_page("search_page");
}

function topic_keyword_toggle(e) {
	var keyword = e.currentTarget.getAttribute("keyword");
	if (document.getElementById("keyword_right_" + keyword).innerHTML == "×") {
		document.getElementById("keyword_right_" + keyword).innerHTML = "+";
		remove_search_term(e);
	} else {
		document.getElementById("keyword_right_" + keyword).innerHTML = "×";
		add_search_term(keyword);
	}
	e.stopPropagation();
}

function toggle_topic_email() {
	if (document.getElementById("email_me_button").classList.contains("form_button_selected")) {
		document.getElementById("email_me_button").classList.remove("form_button_selected");
		document.getElementById("email_me_button").classList.add("form_button_unselected");
		document.getElementById("email_me_button").value="Email Me \u25CB" ;
		cur_topic.allow_email = false;
	} else {
		document.getElementById("email_me_button").classList.add("form_button_selected");
		document.getElementById("email_me_button").classList.remove("form_button_unselected");
		document.getElementById("email_me_button").value="Email Me \u25CF" ;
		cur_topic.allow_email = true;
	}
}

function toggle_topic_notify() {
	if (document.getElementById("notifify_me_button").classList.contains("form_button_selected")) {
		document.getElementById("notifify_me_button").classList.remove("form_button_selected");
		document.getElementById("notifify_me_button").classList.add("form_button_unselected");
		document.getElementById("notifify_me_button").value="Notify Me \u25CB" ;
		cur_topic.allow_notification = false;
	} else {
		document.getElementById("notifify_me_button").classList.add("form_button_selected");
		document.getElementById("notifify_me_button").classList.remove("form_button_unselected");
		document.getElementById("notifify_me_button").value="Notify Me \u25CF" ;
		cur_topic.allow_notification = true;
	}
}
function open_topic_keywords() {
	document.getElementById("topic_keyword_picker").style.display = "block";
	for (var i = 0; i < state.keywords.list.length; i++) {
		var element = document.getElementById("keyword_right_" + state.keywords.list[i]);
		if (cur_topic.search_terms.indexOf(state.keywords.list[i].trim()) > -1) {
			element.innerHTML = "×";
		} else {
			element.innerHTML = "+";
		}
	}
}
function hide_topic_keywords() {
	document.getElementById("topic_keyword_picker").style.display = "none";
}

function draw_search_terms() {
	remove_all_children(document.getElementById("selected_keywords"));
	for (var i = 0; i < cur_topic.search_terms.length; i++) {
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("topic_button_selected");
		div.style.width = "initial";
		div.style.display = "inline-block";
		div.id = "keyword_" + cur_topic.search_terms[i];
		div.setAttribute("keyword", cur_topic.search_terms[i]);
		div.innerHTML = cur_topic.search_terms[i];
		div.addEventListener("click", function(event) {
			remove_search_term(event);
		});
		document.getElementById("selected_keywords").appendChild(div);
	}
}

function add_search_term(search_term) {
	search_term = search_term.replace(hyphen_re, "-");
	search_term = search_term.replace(/\|/g, "_");

	if (cur_topic.search_terms.length >= 10) {
		show_message("A maximum 10 terms can be used per topic", true, 0, "block");
		return;
	}
	if (cur_topic.search_terms.indexOf(search_term.trim()) > -1) {
	} else {
		cur_topic.search_terms.push(search_term.trim());
	}
	draw_search_terms();
}

function remove_search_term(e) {
	cur_topic.search_terms.splice(cur_topic.search_terms.indexOf(e.target.getAttribute("keyword")), 1);
	draw_search_terms();
}

function draw_schedules() {
	remove_all_children(document.getElementById("selected_schedules"));
	for (var i = 0; i < cur_topic.schedules.length; i++) {
		var div = document.createElement("div");
		div.classList.add("topic_keyword_entry");
		div.classList.add("topic_button_selected");
		div.style.width = "initial";
		div.style.display = "inline-block";
		div.id = "schedule_" + cur_topic.schedules[i].hour;
		div.setAttribute("schedule", cur_topic.schedules[i].hour);
		div.innerHTML = cur_topic.schedules[i].hour + ":00";
		div.addEventListener("click", function(event) {
			remove_schedule(event);
		});
		document.getElementById("selected_schedules").appendChild(div);
	}
}

function add_schedule() {
	if (cur_topic.schedules.length >= 3) {
		return;
	}
	var hour = document.getElementById("schedule_hour").value;

	var exists = false;
	for (var i = 0; i < cur_topic.schedules.length; i++) {
		if (cur_topic.schedules[i].hour == hour) {
			exists = true;
			break;
		}
	}

	if (exists) {

	} else {
		cur_topic.schedules.push({"hour": hour, "timezone": timeZone, "offset": cur_date.getTimezoneOffset()});
	}
	draw_schedules();
}

function remove_schedule(e) {

	var cur_index = 0;
	for (var i = 0; i < cur_topic.schedules.length; i++) {
		if (cur_topic.schedules[i].hour == e.target.getAttribute("schedule")) {
			cur_index = i;
			break;
		}
	}

	cur_topic.schedules.splice(cur_index, 1);
	draw_schedules();
}

function save_topic() {
	if (cur_topic.search_terms.length == 0) {
		document.getElementById("selected_keywords_error").innerHTML = "Select keywords to continue";
		document.getElementById("selected_keywords_error").style.display = "block";
		shake_error(document.getElementById("topic_form"));
		return;
	}
	if (document.getElementById("topic_title").value.trim() == "") {
		document.getElementById("topic_title_error").innerHTML = "You must enter a title for this topic";
		document.getElementById("topic_title_error").style.display = "block";
		shake_error(document.getElementById("topic_form"));

		return;
	}
	cur_topic.alert_title = document.getElementById("topic_title").value.trim();

	var url = "https://www.mondoplayer.com/cgi-bin/search_notification.cgi";

	var requeststring = "id=" + license_key + "&alert=" + encodeURIComponent(JSON.stringify(cur_topic));

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	console.log("save_topic: " + xmlhttp.responseText);

	update_topics(true);
	dirty = false;

	save_state();

	clear_shake_error(document.getElementById("topic_form"));

	document.getElementById("right_panel_new_search").style.display = "none";
	document.getElementById("right_panel_new_search_notify").style.display = "none";
	document.getElementById("right_panel_suggestions").style.display = "none";

	show_topics();
}

function delete_topic(title) {
	show_confirm("Are you sure you want to delete the search '" + title + "'?", confirm_delete_topic, "OK", false);
}

function confirm_delete_topic() {
	hide_message();
	var url = 'https://www.mondoplayer.com/cgi-bin/search_notification.cgi';
	var requeststring = "id=" + license_key + "&remove_alert=" + cur_topic.alert_id;

	var xmlhttp = new XMLHttpRequest(requeststring);
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "1") {
		show_message("There was an error deleting the topic.  Please try again", true, 0, "block");
		return;
	} else if (xmlhttp.responseText == "403") {
		console.log("confirm_delete_topic: 403");
		log_back_in();
		return;
	}

	update_topics(true);
	dirty = false;

	save_state();

	//show_page("search_page");
	draw_topics();
}

function update_notifications(force) {
	var now = new Date();

	if (force == false && typeof state.notifications !== "undefined" && now - state.notifications_date < 15 * 60 * 1000 ) {
		draw_notifications();
		return;
	}

	var url = "https://www.mondoplayer.com/cgi-bin/account.cgi";
	var requeststring = "id=" + license_key + "&notifications=1";

	window.scrollTop = 0;

	show_busy("Checking notifications...");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			hide_busy();
			console.log("notifications: " + xmlhttp.responseText);
			if (xmlhttp.responseText == "1") {
				return;
			}
			state.notifications = JSON.parse(xmlhttp.responseText);
			state.notifications_date = new Date();
			var show_notice = false;
			for (var i = 0; i < state.notifications.length; i++) {
				if (state.notifications[i].add_date > state.notifications_recent) {
					show_notice = true;
					state.notifications_recent = state.notifications[i].add_date;
				}
			}
			set_admin_notification();
			save_state();
			if (typeof document.getElementById("notifications") !== "undefined") {
				draw_notifications();
			}
		}
	};
	xmlhttp.open("POST", url, true);
	//xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);
}

function set_admin_notification() {
	var xmlhttp = new XMLHttpRequest();
	requeststring = "action=mondoplayer&form=show_notification&count=" + state.notifications.length;
	xmlhttp.open("POST", admin_post_url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	var elements = document.getElementsByClassName("mondoplayer_notification_count");
	for (var i = 0; i < elements.length; i++) {
		elements[i].innerHTML = "<span class='update-plugins count-" + state.notifications.length + "'><span class='plugin-count'>" + state.notifications.length + "</span></span>";
	}
}

function draw_notifications() {
	if (document.getElementById("notifications") == null) {
		return;
	}
	if (state.notifications.length == 0) {
		document.getElementById("notifications").innerHTML = "<p>No notifications</p>";
		return;
	}
	var report = "<style>.button_column input {margin-left: 4px}</style><p>We have reviewed the search terms in your AutoPilots and here’s some quick things you can do to get better results.</p>";
	var spelling = new Array();
	var unknown = new Array();
	var complex = new Array();
	var complex_struc = new Array();
	var domain = new Array();

	for (var i = 0; i< state.notifications.length; i++) {
		state.notifications[i].origional_index = i;
		if (state.notifications[i].email_type == 0) {
			spelling.push(state.notifications[i]);
		}
		if (state.notifications[i].email_type == 1) {
			unknown.push(state.notifications[i]);
		}
		if (state.notifications[i].email_type == 2) {
			complex.push(state.notifications[i]);
		}
		if (state.notifications[i].email_type == 3) {
			complex_struc.push(state.notifications[i]);
		}
		if (state.notifications[i].email_type == 4) {
			domain.push(state.notifications[i]);
		}
	}

	if (unknown.length > 0) {
		report = report + "<p>We’ve checked our search engine and the following search terms won’t give you videos. You should delete these search terms and try more common terms:</p><table class='wp-list-table fixed widefat striped tags' style='background-color: white'><thead><tr><th class='manage-column column-name column-primary desc'>AutoPilot Title</th><th class='manage-column column-name column-primary desc'>Search Term</th><th class='manage-column column-name column-primary desc'>Possible Alternative</th><th style='width:380px'></th></tr></thead><tbody>";
		for (var i = 0; i < unknown.length; i++) {
			report = report + "<tr><td>" + unknown[i].autopilot_title + "</td><td>" + unknown[i].full_search + "</td><td>" + unknown[i].email_custom + "</td><td class='button_column'>"
			if (unknown[i].email_custom != "") {
				report = report + "<input type='button' value='Use Alternate' onclick='notifications_use_alternate(" + unknown[i].origional_index + ")' />";
			}
			report = report + "<input type='button' value='Edit Search' onclick='notifications_edit_search(" + unknown[i].origional_index + ")' /><input type='button' value='Delete Search' onclick='notifications_delete_search(" + unknown[i].origional_index + ")' /><input type='button' value='Dismiss' onclick='notifications_dismiss_search(" + unknown[i].origional_index + ")' /></td></tr>";
		}
		report = report + "</tbody></table>";
	}

	if (spelling.length > 0) {
		report = report + "<p>Please check or correct the spelling of these search terms:</p><table  class='wp-list-table fixed widefat striped tags' style='background-color: white'><thead><tr><th class='manage-column column-name column-primary desc'>AutoPilot Title</th><th class='manage-column column-name column-primary desc'>Search Term</th><th class='manage-column column-name column-primary desc'>Possible Alternative</th><th style='width:380px'></th></tr></thead><tbody>";
		for (var i = 0; i < spelling.length; i++) {
			report = report + "<tr><td>" + spelling[i].autopilot_title + "</td><td>" + spelling[i].full_search + "</td><td>" + spelling[i].email_custom + "</td><td class='button_column'>"
			if (spelling[i].email_custom != "") {
				report = report + "<input type='button' value='Use Alternate' onclick='notifications_use_alternate(" + spelling[i].origional_index + ")' />";
			}
			report = report + "<input type='button' value='Edit Search' onclick='notifications_edit_search(" + spelling[i].origional_index + ")' /><input type='button' value='Delete Search' onclick='notifications_delete_search(" + spelling[i].origional_index + ")' /><input type='button' value='Dismiss' onclick='notifications_dismiss_search(" + spelling[i].origional_index + ")' /></td></tr>";
		}
		report = report + "</tbody></table>";
	}

	if (complex.length > 0) {
		report = report + "<p>These search terms generated a low volume of results in the past month because the search term was too specific or too long. Please shorten or simplify your search:</p><table  class='wp-list-table fixed widefat striped tags' style='background-color: white'><thead><tr><th class='manage-column column-name column-primary desc'>AutoPilot Title</th><th class='manage-column column-name column-primary desc'>Search Term</th><th style='width:280px'></th></tr></thead><tbody>";
		for (var i = 0; i < complex.length; i++) {
			report = report + "<tr><td>" + complex[i].autopilot_title + "</td><td>" + complex[i].full_search + "</td><td class='button_column'>"
			report = report + "<input type='button' value='Edit Search' onclick='notifications_edit_search(" + complex[i].origional_index + ")' /><input type='button' value='Delete Search' onclick='notifications_delete_search(" + complex[i].origional_index + ")' /><input type='button' value='Dismiss' onclick='notifications_dismiss_search(" + complex[i].origional_index + ")' /></td></tr>";

		}
		report = report + "</tbody></table>";
	}

	if (complex_struc.length > 0) {
		report = report + "<p>These search terms were too narrow to get results. Please simplify your search.</p><table  class='wp-list-table fixed widefat striped tags' style='background-color: white'><thead><tr><th class='manage-column column-name column-primary desc'>AutoPilot Title</th><th class='manage-column column-name column-primary desc'>Search Term</th><th style='width:280px'></th></tr></thead><tbody>";
		for (var i = 0; i < complex_struc.length; i++) {
			report = report + "<tr><td>" + complex_struc[i].autopilot_title + "</td><td>" + complex_struc[i].full_search + "</td><td class='button_column'>";
			report = report + "<input type='button' value='Edit Search' onclick='notifications_edit_search(" + complex_struc[i].origional_index + ")' /><input type='button' value='Delete Search' onclick='notifications_delete_search(" + complex_struc[i].origional_index + ")' /><input type='button' value='Dismiss' onclick='notifications_dismiss_search(" + complex_struc[i].origional_index + ")' /></td></tr>";

		}
		report = report + "</tbody></table>";
	}

	if (domain.length > 0) {
		report = report + "<p>We could not find any video in these domains:</p><table class='wp-list-table fixed widefat striped tags' style='background-color: white'><thead><tr><th class='manage-column column-name column-primary desc'>AutoPilot Title</th><th class='manage-column column-name column-primary desc'>Search Term</th><th class='manage-column column-name column-primary desc' style='width:280px'></th></tr></thead><tbody>";
		for (var i = 0; i < domain.length; i++) {
			report = report + "<tr><td>" + domain[i].autopilot_title + "</td><td>" + domain[i].full_search + "</td><td class='button_column'>";
			report = report + "<input type='button' value='Edit Search' onclick='notifications_edit_search(" + domain[i].origional_index + ")' /><input type='button' value='Delete Search' onclick='notifications_delete_search(" + domain[i].origional_index + ")' /><input type='button' value='Dismiss' onclick='notifications_dismiss_search(" + domain[i].origional_index + ")' /></td></tr>";

		}
		report = report + "</tbody></table>";
	}

	report = report + "<p style='text-align:right'><span id='contact_us_button' class='clickable_link' onclick='toggle_notifications_contact_us()' />Contact Us</span>";

	document.getElementById("notifications").innerHTML = report;
}

function toggle_notifications_contact_us() {
	if (document.getElementById("notifications_contact_us").style.display != "block") {
		document.getElementById("notifications_contact_us").style.display = "block";
		document.getElementById("contact_us_button").innerHTML = "Back";
		window.scrollBy({top: window.innerHeight,left: 0,behavior: 'smooth'});
	} else {
		document.getElementById("contact_us_button").innerHTML = "Contact Us";
		document.getElementById("notifications_contact_us").style.display = "none";
	}
}

function send_notification_message() {
	if (! validate_email(document.getElementById("notifications_contact_us_email").value)) {
		show_message("Please enter a valid email address", true, 0, "block");
		return;
	}
	if (document.getElementById("notifications_contact_us_body").value.trim == "") {
		show_message("Message cannot be blank", true, 0, "block");
		return;
	}

	var url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";

	var requeststring = "id=" + license_key + "&notification_email=" + encodeURIComponent(document.getElementById("notifications_contact_us_email").value.trim()) + "&subject=" + encodeURIComponent(document.getElementById("notifications_contact_us_subject").value.trim())  + "&body=" + encodeURIComponent(document.getElementById("notifications_contact_us_body").value.trim()) + "&autopilot_id=" + cur_autopilot.autopilot_id + "&server_id=" + server_id;

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("POST", url, true);
	//xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);
	toggle_notifications_contact_us();
	show_message("Message Sent", true, 2, "block");;
}

var notification_edit_id = -1;
function notifications_edit_search(id) {
	notification_edit_id = id;
	update_autopilots(false);
	edit_autopilot(state.notifications[id].autopilot_id);
	parse_advanced_search(state.notifications[id].full_search);
	autopilot_edit_search_term_original = state.notifications[id].full_search;
	dirty = false;
	document.getElementById("search_easy_notifications_text").innerHTML = "<h2>Edit Search for AutoPilot '" + state.notifications[id].autopilot_title + "'</h2>";
	document.getElementById("notifications").style.display = "none";
	document.getElementById("search_easy_notifications").style.display = "block";
}
function update_notification_status(id, status) {
	notification_edit_id = id;
	var url = 'https://www.mondoplayer.com/cgi-bin/autopilot.cgi';
	var request_string = 'id=' + license_key + '&update_notification_status=' + encodeURIComponent(state.notifications[id].search_term) + "&autopilot_id=" + state.notifications[id].autopilot_id + "&status=" + status + "&server_id=" + server_id;

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	//xmlhttp.withCredentials = true;
	xmlhttp.send(request_string);
	update_notifications(true);
}
function notifications_use_alternate(id) {
	notification_edit_id = id;
	update_autopilots(false);
	edit_autopilot(state.notifications[id].autopilot_id);
	parse_advanced_search(state.notifications[id].email_custom);
	autopilot_edit_search_term_original = state.notifications[id].full_search;
	dirty = false;
	var search_term = parse_easy_search(document.getElementById("easy_search_all").value, document.getElementById("easy_search_youtube").value, document.getElementById("easy_search_hash").value, document.getElementById("easy_search_phrase").value, document.getElementById("easy_search_any").value, document.getElementById("easy_search_none").value, document.querySelector('input[name="search_embed"]:checked').value);
	autopilot_add_search_term(search_term, false);
	//save_autopilot(false);
	update_notification_status(id, 5);
}
function notifications_delete_search(id) {
	notification_edit_id = id;
	show_confirm("Delete the search '" + state.notifications[id].full_search + "' from the AutoPilot '" + state.notifications[id].autopilot_title + "'?", finish_notifications_delete_search, "Ok", false);
}

function finish_notifications_delete_search(id) {
	hide_busy();
	update_autopilots(false);
	edit_autopilot(state.notifications[notification_edit_id].autopilot_id);
	parse_advanced_search(state.notifications[notification_edit_id].full_search);
	dirty = false;
	autopilot_edit_search_term_original = state.notifications[notification_edit_id].full_search;
	autopilot_delete_search_term();
	save_autopilot(false);
	update_notification_status(notification_edit_id, 3);
}
function notifications_dismiss_search(id) {
	notification_edit_id = id;
	show_confirm("Dismiss the notification for the search '" + state.notifications[id].full_search+ "'?", finish_notifications_dismiss_search, "Ok", false);
}

function finish_notifications_dismiss_search() {
	hide_busy();
	update_notification_status(notification_edit_id, 4);
	notification_edit_id = -1;
}

function notifications_update_search_term() {
	var search_term = parse_easy_search(document.getElementById("easy_search_all").value, document.getElementById("easy_search_youtube").value, document.getElementById("easy_search_hash").value, document.getElementById("easy_search_phrase").value, document.getElementById("easy_search_any").value, document.getElementById("easy_search_none").value, document.querySelector('input[name="search_embed"]:checked').value);

	autopilot_add_search_term(search_term, false);
	//save_autopilot(false);
	update_notification_status(notification_edit_id, 2);
	document.getElementById("notifications").style.display = "block";
	document.getElementById("search_easy_notifications").style.display = "none";
}
function notifications_hide_search() {
	document.getElementById("notifications").style.display = "block";
	document.getElementById("search_easy_notifications").style.display = "none";
}

function autopilot_keyword_toggle(e) {
	var keyword = e.currentTarget.getAttribute("keyword");
	if (document.getElementById("keyword2_right_" + keyword).innerHTML == "×") {
		document.getElementById("keyword2_right_" + keyword).innerHTML = "+";
		autopilot_remove_search_term(e);
	} else {
		document.getElementById("keyword2_right_" + keyword).innerHTML = "×";
		autopilot_add_search_term(keyword, 0);
	}
	e.stopPropagation();
}

function open_autopilot_keywords() {
	document.getElementById("autopilot_keyword_picker").style.display = "block";
	for (var i = 0; i < state.keywords.list.length; i++) {
		var element = document.getElementById("keyword2_right_" + state.keywords.list[i]);
		if (cur_autopilot.search_terms_split.indexOf(state.keywords.list[i].trim()) > -1) {
			element.innerHTML = "×";
		} else {
			element.innerHTML = "+";
		}
	}
}
function hide_autopilot_keywords() {
	document.getElementById("autopilot_keyword_picker").style.display = "none";
}

var search_terms_labels = new Array();
function sort_search_term_labels() {
	console.log("sort_search_term_labels: " + cur_autopilot.search_terms_split.length);
	search_terms_labels = new Array();
	for (var i = 0; i < cur_autopilot.search_terms_split.length; i++) {
		var label_text = "";
		var youtube = false;
		if (typeof cur_autopilot.search_terms_title_split[i] === "undefined" || cur_autopilot.search_terms_title_split[i] == "") {
			label_text = cur_autopilot.search_terms_split[i].replace("&vlog", "").replace("&embed", "");
		} else {
			var cur_search = cur_autopilot.search_terms_split[i].replace(/youtube \S* \S*/, "").trim();
			label_text = "'" + decodeURI(cur_autopilot.search_terms_title_split[i]) + "' on YouTube";
			if (cur_search != "") {
				label_text = label_text + " (" + cur_search + ")";
			}
			youtube = true;
		}
		search_terms_labels.push({title: label_text, index: i, youtube: youtube});
	}
	search_terms_labels.sort(function(a,b) {
		if (a.youtube && !b.youtube) {
			return 1;
		}
		if (!a.youtube && b.youtube) {
			return -1;
		}
		return a.title.localeCompare(b.title);
	});
}

function autopilot_draw_search_terms() {
	sort_search_term_labels();
	remove_all_children(document.getElementById("autopilot_selected_keywords"));
	var show_add_message = true;
	for (var s = 0; s < search_terms_labels.length; s++) {
		var i = search_terms_labels[s].index;
		if (cur_autopilot.search_terms_split[i].trim() == "") {
			continue;
		}
		show_add_message = false;
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("tag_flex");
		div.style.width = "initial";
		div.style.display = "inline-block";
		div.id = "keyword_" + cur_autopilot.search_terms_split[i];
		div.setAttribute("keyword", cur_autopilot.search_terms_split[i]);
		div.setAttribute("index", i);
		div.addEventListener("click", function(event) {
			autopilot_show_search(true);
			autopilot_edit_search_term(event.target.getAttribute("index"));
			event.stopPropagation();
			return false;
		});

		var label = document.createElement('div');
		label.classList.add("tag_inner_left");
		label.setAttribute("keyword", cur_autopilot.search_terms_split[i]);
		label.setAttribute("index", i);
		var label_text = search_terms_labels[s].title;
		if (label_text.length > 50) {
			label_text = label_text.substr(0,50) + "...";
		}

		label.innerHTML = label_text;
		label.addEventListener("click", function(event) {
			autopilot_show_search(true);
			autopilot_edit_search_term(event.target.getAttribute("index"));
			event.stopPropagation();
			return false;
		});
		div.appendChild(label)
		var edit_button = document.createElement('img');
		edit_button.src = "" + image_url + "tag_edit_on_blank_dark.png";
		edit_button.classList.add("tag_inner_right");
		edit_button.style.height = "16px";
		edit_button.style.verticalAlign = "middle";
		edit_button.setAttribute("keyword", cur_autopilot.search_terms_split[i]);
		edit_button.setAttribute("index", i);
		edit_button.addEventListener("click", function(event) {
			autopilot_show_search(true);
			autopilot_edit_search_term(event.target.getAttribute("index"));
			event.stopPropagation();
			return false;
		});
		div.appendChild(edit_button)
		document.getElementById("autopilot_selected_keywords").appendChild(div);
	}
	if (show_add_message) {
		document.getElementById("autopilot_selected_keywords").innerHTML = "<div style='padding: 8px;font-size: 14px;letter-spacing: 0.7px;color: #ccc'>Add searches for this autopilot</div>";
	}
}

var finish_search_term = "";
var search_term_test_counts = new Object();
var add_easy_search;
function autopilot_finish_add_search_term () {
	autopilot_add_search_term("", add_easy_search);
}
function autopilot_add_search_term(keyword, source, get_hashtags = false) {
	add_easy_search = source;
	var feedback = false;
	var search_term = keyword;
	if (keyword == '') {
		if (source) {
			search_term = document.getElementById("search_entry").value;
			parse_advanced_search(search_term);
		} else {
			search_term = parse_easy_search(document.getElementById("easy_search_all").value, document.getElementById("easy_search_youtube").value, document.getElementById("easy_search_hash").value, document.getElementById("easy_search_phrase").value, document.getElementById("easy_search_any").value, document.getElementById("easy_search_none").value, document.querySelector('input[name="search_embed"]:checked').value);
		}
	} else {
		parse_advanced_search(search_term);
	}

	search_term = search_term.replace(hyphen_re, "-");
	search_term = search_term.replace(/\|/g, "_");

	if (search_term == "") {
		return;
	}

	if (cur_autopilot.search_terms_split.indexOf(search_term.trim()) > -1) {
		//show_message("<div class='popup_message_title'>Duplicate Search Term</div><div class='popup_message_body'>The search term '" + search_term + "' is already in this AutoPilot.</div>", true, 0, "block");
		//return;
	}

	if (cur_autopilot.search_terms_split.length >= 100) {
		show_message("<div class='popup_message_title'>Search Term Limit Exceeded</div><div class='popup_message_body'>You have 100 search terms in this AutoPilot. <br />Delete search terms that are not producing results or add a new AutoPilot.</div>", true, 0, "block");
		return;
	}

	if (get_hashtags) {
		document.getElementById("autopilot_search_hashtag_popup").style.display = "flex";
		return;
	}
	var complex_search = "";
	var search_term_split = search_term.split(' ');
	if (search_term_split.length > 2 && feedback) {
		complex_search  = "<br /><div class='popup_message_title'>Complex Search Term</div><div class='popup_message_body'>This search term may be too specific to generate a consistent supply of video.<br />Try making the search term shorter or more general.</div>";
	}
	finish_search_term = "";

	if (typeof search_term_test_counts[search_term] !== "undefined") {
		var object_count = search_term_test_counts[search_term];
		finish_search_term = search_term;

		if (object_count > 2) {
			var url = "https://www.mondoplayer.com/cgi-bin/search.cgi";
			var requeststring = "id=" + license_key + "&platform=1&test_search=" + encodeURIComponent(finish_search_term);

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("POST", url, false);
			xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlhttp.setRequestHeader("Accept", "text/plain");
			xmlhttp.send(requeststring);

			var test_object = JSON.parse(xmlhttp.responseText);
			var test_object_table = "";
			var test_object_titles = new Array();
			for (var i = 0; i < test_object.length; i++) {
				if (test_object[i].title != "") {
					if (test_object_titles.indexOf(test_object[i].title) > -1) {
						continue;
					}
					test_object_titles.push(test_object[i].title);
					test_object_table = test_object_table + "<tr><td style='vertical-align: top'><a href='" + test_object[i].url + "' target='_blank'>►</a></td><td><a href='" + test_object[i].url + "' target='_blank'>" + test_object[i].title + "</a></td></tr>";
					}
				}

			show_confirm("<div class='popup_message_title'>Good Search Term</div><div class='popup_message_body'>This search term produced  " + object_count.toLocaleString() + " videos in the last 30 days.</div><div  class='popup_message_body' style='text-align:left;margin-top: 12px;font-size: 16px'><div>Example videos:</div><div style='padding-left: 30px;max-height: 200px;overflow:auto'><table>" + test_object_table.replace(/&amp;/g, "&") + "</table></div></div>", finish_add_search, "Ok", true);
		} else {
			show_confirm("<div class='popup_message_title'>Search Term in Learning Mode</div><div class='popup_message_body'>It may take several days to optimize your results.<br />You will receive status updates by Email.</div>" + complex_search, finish_add_search, "Ok", true);
		}
		return;
	}

	if (search_term.match(/youtube user/) || search_term.match(/youtube channel/) || search_term == autopilot_edit_search_term_original) {
		finish_search_term = search_term;
		finish_add_search();
		return;
	}
	show_busy("Checking...");
	var url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";

	var requeststring = "id=" + license_key + "&test_search_term=" + encodeURIComponent(search_term) + "&server_id=" + server_id;

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			hide_busy();
			clear_shake_error(document.getElementById("autopilot_form"));

			var object_count = parseInt(xmlhttp.responseText);
			search_term_test_counts[search_term] = object_count;
			finish_search_term = search_term;

			if (object_count > 3) {
				var requeststring = "id=" + license_key + "&platform=1&test_search=" + encodeURIComponent(finish_search_term);
				var url = "https://www.mondoplayer.com/cgi-bin/search.cgi";

				xmlhttp = new XMLHttpRequest();
				xmlhttp.open("POST", url, false);
				xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xmlhttp.setRequestHeader("Accept", "text/plain");
				xmlhttp.send(requeststring);


				var test_object = JSON.parse(xmlhttp.responseText);
				var test_object_table = "";
				var test_object_titles = new Array();
				for (var i = 0; i < test_object.length; i++) {
					if (test_object[i].title != "") {
						if (test_object_titles.indexOf(test_object[i].title) > -1) {
							continue;
						}
						test_object_titles.push(test_object[i].title);
					test_object_table = test_object_table + "<tr><td style='vertical-align: top'><a href='" + test_object[i].url + "' target='_blank'>►</a></td><td><a href='" + test_object[i].url + "' target='_blank'>" + test_object[i].title + "</a></td></tr>";
						}
					}

				show_confirm("<div class='popup_message_title'>Good Search Term</div><div class='popup_message_body'>This search term produced  " + object_count.toLocaleString() + " videos in the last 30 days.</div><div  class='popup_message_body' style='text-align:left;margin-top: 12px;font-size: 16px'><div>Example videos:</div><div style='padding-left: 30px;max-height: 200px;overflow:auto'><table>" + test_object_table.replace(/&amp;/g, "&") + "</table></div></div>", finish_add_search, "Ok", true);
			} else {
				show_confirm("<div class='popup_message_title'>Search Term in Learning Mode</div><div class='popup_message_body'>It may take several days to optimize your results.<br />You will receive status updates by Email.</div>" + complex_search, finish_add_search, "Ok", true);
			}

		} else if (this.readyState == 4) {
			hide_busy();
			clear_shake_error(document.getElementById("autopilot_form"));
			finish_search_term = search_term;
			finish_add_search();

			console.log("ERROR: " + this.stats);
		}
	};

	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);
}

function finish_add_search() {
	var search_term = finish_search_term;
	var index = -1;
	var cur_hashtags = {fixed:[],variable:[],variable_count:0};
	var toggles = document.querySelectorAll("#autopilot_search_hashtags_selected .toggle_inside");
	for (var i = 0; i < toggles.length; i++) {
		if (toggles[i].style.left == "18px") {
			cur_hashtags.variable.push(toggles[i].getAttribute("hashtag"));
		} else {
			cur_hashtags.fixed.push(toggles[i].getAttribute("hashtag"));
		}
	}
	cur_hashtags.variable_count = edit_search_hashtags_variable_count ;
	//console.log("cur_hashtags: " + JSON.stringify(cur_hashtags));
	if (cur_autopilot.search_terms_split.length > 100) {
	} else {
		if (autopilot_edit_search_term_original_index != -1) {
			cur_autopilot.search_terms_split[autopilot_edit_search_term_original_index] = search_term.trim();
			cur_autopilot.hashtags.search[autopilot_edit_search_term_original_index] = cur_hashtags;
			cur_autopilot.search_terms_date_split[autopilot_edit_search_term_original_index] = -1;
		} else {
			cur_autopilot.search_terms_split.push(search_term.trim());
			cur_autopilot.hashtags.search.push(cur_hashtags);
			cur_autopilot.search_terms_date_split.push(-1);
		}
	}
	document.getElementById("easy_search_search_button_autopilot").value = "Add Search";

	document.getElementById("mondotag_overlay").style.display = "none";
	autopilot_draw_search_terms();
	autopilot_draw_hashtags();
	autopilot_hide_search();

	//if (autopilot_edit_search_term_original != "" && autopilot_edit_search_term_original != search_term.trim()) {
	//	if (cur_autopilot.hashtags.active > 0 && cur_autopilot.hashtags.fixed.length + cur_autopilot.hashtags.variable.length + cur_autopilot.hashtags.search[index].fixed.length + cur_autopilot.hashtags.search[index].variable.length > 0) {
	//		setTimeout('show_message("Changes have been made to search terms - check your hashtags to insure they are still relevant.", true, 0, "block");', 250);
	//	}
	//}
	document.getElementById("autopilot_search_hashtag_popup").style.display = "none";
	autopilot_edit_search_term_original = "";
	autopilot_edit_search_term_original_index = -1;
}

function autopilot_delete_search_term() {
	var index = cur_autopilot.search_terms_split.indexOf(autopilot_edit_search_term_original);
	cur_autopilot.search_terms_split.splice(index, 1);
	cur_autopilot.search_terms_date_split.splice(index, 1);
	cur_autopilot.search_terms_title_split.splice(index, 1);
	if (typeof cur_autopilot.hashtags.search[index] !== "undefined") {
		cur_autopilot.hashtags.search.splice(index, 1);
	}
	autopilot_edit_search_term_original = "";
	document.getElementById("mondotag_overlay").style.display = "none";
	autopilot_draw_search_terms();
	autopilot_draw_hashtags();
	autopilot_hide_search();
}

function autopilot_remove_search_term(e) {
	var index = cur_autopilot.search_terms_split.indexOf(e.target.getAttribute("keyword"));
	cur_autopilot.search_terms_split.splice(index, 1);
	cur_autopilot.search_terms_date_split.splice(index, 1);
	if (typeof cur_autopilot.hashtags.search[index] !== "undefined") {
		cur_autopilot.hashtags.search.splice(index, 1);
	}
	document.getElementById("mondotag_overlay").style.display = "none";
	autopilot_draw_search_terms();
	autopilot_draw_hashtags();
}

var autopilot_edit_search_term_original_index = -1;
var autopilot_edit_search_term_original = "";
var autopilot_edit_search_term_hashtags_original;
var autopilot_edit_search_term_hashtags_new;

function autopilot_edit_search_term(index) {
	autopilot_edit_search_term_original_index = index
	autopilot_edit_search_term_original = cur_autopilot.search_terms_split[index];
	document.getElementById("easy_search_search_button_autopilot").value = "Save Changes";

	parse_advanced_search(autopilot_edit_search_term_original);
	autopilot_edit_search_term_hashtags_original = new Object();
	autopilot_edit_search_term_hashtags_original = cur_autopilot.hashtags.search[index];
	autopilot_edit_search_term_hashtags_new = cur_autopilot.hashtags.search[index];

	for (var i = 0; i < autopilot_edit_search_term_hashtags_new.fixed.length; i++) {
		add_search_hashtag(autopilot_edit_search_term_hashtags_new.fixed[i], 0);
	}
	for (var i = 0; i < autopilot_edit_search_term_hashtags_new.variable.length; i++) {
		add_search_hashtag(autopilot_edit_search_term_hashtags_new.variable[i], 1);
	}
	search_hashtag_set_variable_count();
	sort_search_hashtags();
	document.getElementById("autopilot_search_hashtag_variable_count").value = autopilot_edit_search_term_hashtags_new.variable_count;
}

function sort_search_hashtags() {
	var node_list = document.querySelectorAll("#autopilot_search_hashtag_list .tag");
	var node_array = Array.prototype.slice.call(node_list, 0);
	node_array.sort(function(a, b) {
		return a.getAttribute("hashtag").substr(1).toLowerCase().localeCompare(b.getAttribute("hashtag").substr(1).toLowerCase());
	});
	for (var i = 0; i < node_array.length; i++) {
		document.getElementById("autopilot_search_hashtag_list").appendChild(node_array[i]);
	}
	node_list = document.querySelectorAll("#autopilot_search_hashtags_selected .search_cur_hashtag_entry");
	node_array = Array.prototype.slice.call(node_list, 0);
	node_array.sort(function(a, b) {
		return a.getAttribute("hashtag").substr(1).toLowerCase().localeCompare(b.getAttribute("hashtag").substr(1).toLowerCase());
	});
	for (var i = 0; i < node_array.length; i++) {
		document.getElementById("autopilot_search_hashtags_selected").appendChild(node_array[i]);
	}
}

function autopilot_draw_schedules() {
	var schedule_display = "";
	remove_all_children(document.getElementById("autopilot_selected_schedules"));

	cur_autopilot.schedule.sort(function(a, b) {
		if (parseInt(a.day) < parseInt(b.day) || (parseInt(a.day) == parseInt(b.day) && parseInt(a.hour) < parseInt(b.hour))) {
			return -1;
		} else {
			return 1;
		}
	});
	var cur_day = -1;
	var cur_line = new Array(7);
	var report = "<table style='width:100%;background-color: white' cellpadding='0' cellspacing='0'>";
	var display_line = new Array(7);
	var report_sunday = "";

	for (var i = 0; i < cur_autopilot.schedule.length; i++) {
		if (cur_autopilot.schedule[i].day != cur_day) {
			if (typeof cur_line[cur_day] !== "undefined" && typeof cur_line[cur_day] != null) {
				report = report + "</div></td></tr>";
			}
			cur_day = cur_autopilot.schedule[i].day;
			if (cur_day == 0){
				report_sunday = report_sunday + "<tr><td style='width: 75px'><div class='autopilot_email_schedule_day'>" + weekdays[cur_day] + "</td><td><div style='padding-bottom: 12px'>";
			} else {
				report = report + "<tr><td style='width: 75px'><div class='autopilot_email_schedule_day'>" + weekdays[cur_day] + "</td><td><div style='padding-bottom: 12px'>";
			}
			display_line[cur_day] = "";
		}
		if (display_line[cur_day] != "") {
			display_line[cur_day] = display_line[cur_day] + ", ";
		}
		display_line[cur_day] = display_line[cur_day] + cur_autopilot.schedule[i].hour + ":00";
		if (cur_day == 0){
			report_sunday = report_sunday + "<div class='tag tag_small tag_grey topic_button_selected' onclick='autopilot_remove_schedule(" + cur_autopilot.schedule[i].day + "," + cur_autopilot.schedule[i].hour + ")'>" +  cur_autopilot.schedule[i].hour + ":00</div>";
		} else {
				report = report + "<div class='tag tag_small tag_grey topic_button_selected' onclick='autopilot_remove_schedule(" + cur_autopilot.schedule[i].day + "," + cur_autopilot.schedule[i].hour + ")'>" +  cur_autopilot.schedule[i].hour + ":00</div>";
		}
	}
	for (var i = 0; i < 7; i++) {
		var day = i + 1;
		if (day == 7) {
			day = 0;
		}
		var day_list = new Array;
		if (typeof display_line[day] !== "undefined" && display_line[day] != "") {
			day_list.push(day);
			for (var t = day; t < 7; t++) {
				var sub_day = t + 1;
				if (sub_day == 7) {
					sub_day = 0;
				}
				if (display_line[sub_day] == display_line[day]) {
					day_list.push(sub_day);
					display_line[sub_day] = "";
				}
			}
			var day_list_string = "";
			if (day_list.length > 2) {
				var continuous = true;
				for (var t = 1; t < day_list.length; t++) {
					if (day_list[t] - day_list[t -1] > 1) {
						continuous = false;
						break;
					}
				}
				if (continuous) {
					day_list_string = weekdays[day_list[0]] + " - " + weekdays[day_list[day_list.length - 1]];
				}
			}
			if (day_list_string == "") {
				for (var t = 0; t < day_list.length; t++) {
					if (day_list_string != "") {
						day_list_string = day_list_string + ", ";
					}
					day_list_string = day_list_string + weekdays[day_list[t]];
				}
			}
			var border = "";
			if (schedule_display == "") {
				border = "border:0";
			}
			schedule_display = schedule_display + "<tr><td style='padding-right: 12px;min-width: 90px;" + border + "'>" + day_list_string + "</td><td style='" + border + "'>" + display_line[day] + "</td></tr>";
		}
	}

	document.getElementById("autopilot_selected_schedules").innerHTML = report + report_sunday + "</div></td></tr></table>";
	document.getElementById("schedule_display_list").innerHTML ="<table style='color: #777' cellpadding='4'>" + schedule_display + "</table>";
}

var autopilot_schedule_reminder = true;
function autopilot_add_schedule() {
	var hour = document.getElementById("autopilot_schedule_hour").value;
	var day = document.getElementById("autopilot_schedule_day").value;

	if (day < 7) {
		autopilot_add_schedule_item(day, hour);
	} else if (day == 7) {
		for (var i = 1; i < 6; i++) {
			autopilot_add_schedule_item(i, hour);
		}
	} else if (day == 8) {
		for (var i = 0; i < 7; i++) {
			autopilot_add_schedule_item(i, hour);
		}
	}

	autopilot_draw_schedules();
	//if (autopilot_schedule_reminder && (is_subscribed == 0 || is_trial == 1) && (cur_autopilot.schedule.length > 0 || autopilots.length > 1)) {
	//	show_confirm("<p style='text-align: left;font-size: 24px'>Your Free MondoPlayer account gives you one post per week.</p><p style='text-align: left;font-size: 24px'>To upgrade to MondoPlayer Pro, click Upgrade.</p>", show_upgrade, "Upgrade", false);
	//	autopilot_schedule_reminder = false;
	//}
}

function autopilot_add_schedule_item(day, hour) {
	var exists = false;

	for (var i = 0; i < cur_autopilot.schedule.length; i++) {
		if (cur_autopilot.schedule[i].hour == hour && cur_autopilot.schedule[i].day == day ) {
			exists = true;
		}
	}

	if (exists) {

	} else {
		cur_autopilot.schedule.push({"hour": hour, "day": day});
	}
}

function autopilot_remove_schedule(day, hour) {
	var cur_index = 0;
	for (var i = 0; i < cur_autopilot.schedule.length; i++) {
		if (cur_autopilot.schedule[i].hour == hour && cur_autopilot.schedule[i].day == day) {
			cur_index = i;
			break;
		}
	}

	cur_autopilot.schedule.splice(cur_index, 1);
	autopilot_draw_schedules();
}
function get_search_csv() {
	var report = new Array();
	for (var i = 0; i < autopilot_list.autopilots.length; i++) {
		if (cur_autopilot.autopilot_id != 0 && cur_autopilot.autopilot_id != autopilot_list.autopilots[i].autopilot_id) {
			continue;
		}
		var searches = autopilot_list.autopilots[i].search_terms.split("|");
		var hashtags = {search:[]};

		try {
			hashtags = JSON.parse(autopilot_list.autopilots[i].hashtags_string);
		}
		catch(e) {
			console.log("invalid hashtag string: " + autopilot_list.autopilots[i].hashtags_string);
		}
		for (var s = 0; s < searches.length; s++) {
			if (searches[s] == "") {
				continue;
			}
			var current_search = new Array();
			current_search[0] = searches[s].replaceAll('"', '""');
			if (current_search[0].indexOf(",") > -1 || current_search[0].indexOf('"') > -1) {
				current_search[0] = '"' + current_search[0] + '"';
			}
			current_search[1] = autopilot_list.autopilots[i].title.replaceAll('"', '""')
			if (current_search[1].indexOf(",") > -1 || current_search[1].indexOf('"') > -1) {
				current_search[1] = '"' + current_search[1] + '"';
			}
			current_search[2] = "";
			current_search[3] = "";
			current_search[4] = "1";
			if (typeof hashtags.search[s] !== "undefined") {
				if (typeof hashtags.search[s].fixed !== "undefined") {
					current_search[2] = hashtags.search[s].fixed.join(';');
				}
				if (typeof hashtags.search[s].variable !== "undefined") {
					current_search[3] = hashtags.search[s].variable.join(';');
				}
				if (typeof hashtags.search[s].variable_count !== "undefined" && hashtags.search[s].variable_count > 1) {
					current_search[4] = hashtags.search[s].variable_count;
				}
			}
			report.push(current_search);
		}
	}
	var csv = "Search,AutoPilot,Hashtags - Every Post,Hashtags - Variable,Variable Count\n";
	for (var i = 0; i < report.length; i++) {
		csv = csv + report[i].join(",");
		csv = csv + "\n";
	}

	const csv_blob = new Blob([csv], { type: 'text/csv'});

	var download_element = document.createElement('a');
	const csv_url = URL.createObjectURL(csv_blob);
	download_element.href = csv_url;
	download_element.id="download_element";
	download_element.target = '_blank';
	var cur_date = new Date();
	download_element.download = 'autopilot_searches-' + cur_date.toISOString().replace(/\D/g,'') + '.csv';
	document.getElementById("autopilot_page_title").appendChild(download_element);
	const clickHandler = () => {
		setTimeout(() => {
			URL.revokeObjectURL(csv_url);
			this.removeEventListener('click', clickHandler);
		}, 150);
	};
	download_element.addEventListener('click', clickHandler, false);

    download_element.click();
}

function open_save_search_csv() {
	document.getElementById("search_upload_wrapper").style.display = "flex";
	document.getElementById("search_upload").style.display = "flex";
	document.getElementById("search_upload").style.width = "unset";
	document.getElementById("upload_button_wrapper").style.display = "block";
	document.getElementById("search_upload_detail_wrapper").style.display = "none";
}
function close_save_search_csv() {
	document.getElementById("search_upload_wrapper").style.display = "none";
}

var csv_autopilots = new Object();
var csv_autopilots_index = null;
function open_search_csv() {
	const uploaded_file = document.getElementById('csv_file').files[0];
	let reader = new FileReader();


	reader.readAsText(uploaded_file);
	reader.onload = function() {
		read_csv(reader.result);
	};
	reader.onerror = function() {
		console.log(reader.error);
		show_message("There was an error reading your file - please try again", true, 0, "block");
		return;
	};
}

function read_csv(csv_string) {
	var autopilot_ids = new Object();
	for (var i = document.getElementById("search_upload_autopilot_picker").options.length; i >= 0; i--) {
		document.getElementById("search_upload_autopilot_picker").options.remove(i);
	}
	var option = document.createElement("option");
	option.value = 0;
	option.text = "Please select an AutoPilot...";
	document.getElementById("search_upload_autopilot_picker").options.add(option);

	for (var i = 0; i < autopilot_list.autopilots.length; i++) {
		autopilot_ids[autopilot_list.autopilots[i].title.toLowerCase().trim()] = autopilot_list.autopilots[i].autopilot_id;
		option = document.createElement("option");
		option.value = autopilot_list.autopilots[i].autopilot_id;
		option.text = autopilot_list.autopilots[i].title;
		document.getElementById("search_upload_autopilot_picker").options.add(option);
	}

	let csv = csv_string_to_array(csv_string);
	//let csv = csvStringToArray(csv_string);
	console.log("csv_string: " + csv_string);
	console.log("csv: " + JSON.stringify(csv));

	if (csv.length == 0 || (csv.length == 1 && csv[0][0] == "search" && csv[0][1] == "autopilot")) {
		show_message("The .CSV file was empty - please try another file", true, 0, "block");
		return;
	}

	var is_csv = false;
	if (csv[0][0] == "Search" && csv[0][1] == "AutoPilot") {
		is_csv = true;
	}

	csv_autopilots = new Object();
	csv_autopilots_index = null;

	for (var i = 0; i < csv.length; i++) {
		if (is_csv && csv[i][0] == "Search" && csv[i][1] == "AutoPilot") {
			continue;
		}
		if (csv[i][0].trim() == "") {
			continue;
		}
		if (csv[i].length != 5 && is_csv) {
			show_message("There is a problem with line " + i + " in this .csv file.  It should have 5 columns<br /><pre>" + csv[i].join(",") + "</pre>");
			return;
		}

		csv[i][0] = csv[i][0].replaceAll('“', '"').replaceAll('”', '"');
		var fixed = new Array();
		var variable = new Array();
		var variable_count = 1;
		if (is_csv) {
			csv[i][1] = csv[i][1].replaceAll('“', '"').replaceAll('”', '"');
			var temp_fixed = csv[i][2].split(/;/);
			//for (var t = temp_fixed.length -1; t >= 0; t--) {
			for (var t = 0; t < temp_fixed.length; t++) {
				if (temp_fixed[t].trim() == "") {
					continue;
				}
				fixed.push(temp_fixed[t]);
			}
			var temp_variable = csv[i][3].split(/;/);
			//for (var t = temp_variable.length -1; t >= 0; t--) {
			for (var t = 0; t < temp_variable.length; t++) {
				if (temp_variable[t].trim() == "") {
					continue;
				}
				variable.push(temp_variable[t]);
			}
			variable_count = parseInt(csv[i][4]);
		} else {
			csv[i][1] = ""
		}
		if (typeof csv_autopilots[csv[i][1].toLowerCase().trim()] == "undefined") {
			csv_autopilots[csv[i][1].toLowerCase().trim()] = new Object();
			csv_autopilots[csv[i][1].toLowerCase().trim()].autopilot_id = 0;
			csv_autopilots[csv[i][1].toLowerCase().trim()].title = csv[i][1];
			csv_autopilots[csv[i][1].toLowerCase().trim()].searches = new Array();
		}
		csv_autopilots[csv[i][1].toLowerCase().trim()].searches.push({search: csv[i][0],fixed: fixed, variable: variable, variable_count: variable_count});
	}

	if (is_csv) {
		for (var autopilot_title in csv_autopilots) {
			if (typeof autopilot_ids[autopilot_title] == "undefined") {
				show_message(".CSV file contains reference to an AutoPilot named \"" + csv_autopilots[autopilot_title].title + "\" that doesn't exist");
				return;
			}
			csv_autopilots[autopilot_title].autopilot_id = autopilot_ids[autopilot_title];
		}
	}
	process_csv_autopilots();
}

var csv_changes = {unchanged:[],new:0,deleted:[]};
function process_csv_autopilots() {
	hide_message();
	document.getElementById("upload_button_wrapper").style.display = "none";
	document.getElementById("search_upload").style.width = "100%";
	document.getElementById("search_upload_detail_wrapper").style.display = "block";
	var csv_autopilots_keys = Object.keys(csv_autopilots);
	console.log('csv_autopilots_keys: ' + JSON.stringify(csv_autopilots_keys));
	var temp_autopilot = csv_autopilots[csv_autopilots_keys[0]];
	var csv_key_index = 1;
	if (csv_autopilots_index !== null) {
		var found = false;
		for (var i = 0; i < csv_autopilots_keys.length; i++) {
			if (found == true) {
				csv_autopilots_index = csv_autopilots_keys[i];
				csv_key_index = i + 1;
				break;
			}
			if (csv_autopilots_keys[i] == csv_autopilots_index  && i < csv_autopilots_keys.length - 1) {
				found = true;
			}
		}
		if (! found) {
			show_confirm("Upload Complete", finish_csv_upload, "Done", true, "");
			return;
		}
		temp_autopilot = csv_autopilots[csv_autopilots_index];
	} else {
		csv_autopilots_index = csv_autopilots_keys[0];
	}
	if (temp_autopilot.autopilot_id > 0) {
		set_cur_autopilot(temp_autopilot.autopilot_id);
		document.getElementById("search_upload_autopilot_picker").value = temp_autopilot.autopilot_id;
		document.getElementById("search_upload_detail_title").innerHTML = "Uploading Searches to AutoPilot \"" + temp_autopilot.title + "\"";
		document.getElementById("search_upload_autopilot_picker_wrapper").style.display = "none";
	} else {
		document.getElementById("search_upload_detail_title").innerHTML = "Choose an AutoPilot to Update";
		document.getElementById("search_upload_autopilot_picker_wrapper").style.display = "block";
	}
	csv_changes = {unchanged:[],new:0,deleted:[]};
	for (var i = 0; i < cur_autopilot.search_terms_split.length; i++) {
		var found = false
		var found_index = -1;
		for (var n = 0; n < temp_autopilot.searches.length; n++) {
			if (cur_autopilot.search_terms_split[i].trim() == temp_autopilot.searches[n].search.trim()) {
				var cur_fixed = "";
				if (typeof cur_autopilot.hashtags.search[i].fixed !== "undefined" && cur_autopilot.hashtags.search[i].fixed.length > 0 && cur_autopilot.hashtags.search[i].fixed.join(" ").trim() != "") {
					cur_fixed = cur_autopilot.hashtags.search[i].fixed.join(" ").trim();
				}
				var cur_variable = "";
				if (typeof cur_autopilot.hashtags.search[i].variable !== "undefined" && cur_autopilot.hashtags.search[i].variable.length > 0 && cur_autopilot.hashtags.search[i].variable.join(" ").trim() != "") {
					cur_variable = cur_autopilot.hashtags.search[i].variable.join(" ").trim();
				}
				console.log("matched search " + cur_autopilot.search_terms_split[i].trim());
				console.log(" fixed: " + cur_fixed + " - " + temp_autopilot.searches[n].fixed.join(" ").trim())
				console.log(" variable: " + cur_variable + " - " + temp_autopilot.searches[n].variable.join(" ").trim())
				if (cur_fixed == temp_autopilot.searches[n].fixed.join(" ").trim() && cur_variable == temp_autopilot.searches[n].variable.join(" ").trim()) {
					found = true;
				}
				found_index = n;
				break;
			}
		}
		if (found) {
			csv_changes.unchanged.push(found_index);
		} else {
			csv_changes.deleted.push(i);
		}
	}
	csv_changes.new = temp_autopilot.searches.length - csv_changes.unchanged.length;

	var preview = "<p>" + csv_changes.unchanged.length + " Searches were Unchanged </p>";
	preview = preview + "<p>" + csv_changes.new + " Searches are New</p>"
	preview = preview + "<table class='alternating' style='margin-left: 20px'><thead><tr><th style='width: 600px;text-align: left'>New Search Terms</th><th style='width: 270px;text-align: left'>Fixed Hashtags</th><th style='width: 270px;text-align: left'>Variable Hashtags</th></tr></thead><tbody>";
	for (var i = 0; i < temp_autopilot.searches.length; i++) {
		if (csv_changes.unchanged.indexOf(i) == -1) {
			preview = preview + "<tr><td>" + temp_autopilot.searches[i].search.replaceAll("&vlog", "").replaceAll("&embed", "") + "</td><td>" + temp_autopilot.searches[i].fixed.join(" ") + "</td><td>" + temp_autopilot.searches[i].variable.join(" ") + "</td></tr>";
		}
	}
	preview = preview + "</tbody></table>";
	preview = preview + "<p>" + csv_changes.deleted.length + " Searches are Deleted</p>"
	preview = preview + "<table class='alternating' style='margin-left: 20px'><thead><tr><th style='width: 600px;text-align: left'>Deleted Search Terms</th><th style='width: 270px;text-align: left'>Fixed Hashtags</th><th style='width: 270px;text-align: left'>Variable Hashtags</th></tr></thead><tbody>";
	for (var i = 0; i < cur_autopilot.search_terms_split.length; i++) {
		if (csv_changes.deleted.indexOf(i) != -1) {
			var cur_fixed = "";
			if (typeof cur_autopilot.hashtags.search[i].fixed !== "undefined" && cur_autopilot.hashtags.search[i].fixed.length > 0 && cur_autopilot.hashtags.search[i].fixed.join(" ").trim() != "") {
				cur_fixed = cur_autopilot.hashtags.search[i].fixed.join(" ").trim();
			}
			var cur_variable = "";
			if (typeof cur_autopilot.hashtags.search[i].variable !== "undefined" && cur_autopilot.hashtags.search[i].variable.length > 0 && cur_autopilot.hashtags.search[i].variable.join(" ").trim() != "") {
				cur_variable = cur_autopilot.hashtags.search[i].variable.join(" ").trim();
			}
			preview = preview + "<tr><td>" + cur_autopilot.search_terms_split[i].replaceAll("&vlog", "").replaceAll("&embed", "") + "</td><td>" + cur_fixed + "</td><td>" + cur_variable + "</td></tr>";
		}
	}
	preview = preview + "</tbody></table>";
	document.getElementById("search_upload_detail_preview").innerHTML = preview;

	if (csv_changes.new == 0 && csv_changes.deleted.length == 0) {
		document.getElementById("add_autopilot_searches").style.backgroundColor = "#999";
	} else {
		document.getElementById("add_autopilot_searches").style.backgroundColor = "";
	}
}
function select_autopilot_upload() {
	set_cur_autopilot(document.getElementById("search_upload_autopilot_picker").value);
}
function finish_csv_upload() {
	if (is_saving) {
		return;
	}
	hide_message();
	close_save_search_csv();
	show_busy("Loading...");
	window.location = window.location.href.replace("#", "") + "&saved=1";
}

function csv_string_to_array(string) {
	const re = /(,|\r?\n|\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^,\r\n]*))/gi
	const result = [[]];
	let matches;
	while ((matches = re.exec(string))) {
		if (matches[1].length && matches[1] !== ',') {
			result.push([]);
		}
		result[result.length - 1].push(
			matches[2] !== undefined ? matches[2].replace(/""/g, '"') : matches[3]
		)
  }
  return result;
}

function continue_csv_searches() {
	if (document.getElementById("search_upload_autopilot_picker").value == 0) {
		show_message("You must pick an AutoPilot");
		return;
	}
	if (csv_changes.new == 0 && csv_changes.deleted.length == 0) {
		return;
	}
	var autopilot_searches = new Array();
	var autopilot_title = "";
	for (var i = 0; i < autopilot_list.autopilots.length; i++) {
		if (autopilot_list.autopilots[i].autopilot_id == document.getElementById("search_upload_autopilot_picker").value) {
			autopilot_searches = autopilot_list.autopilots[i].search_terms.split("|");
			autopilot_title = autopilot_list.autopilots[i].title;
			continue;
		}
	}
	document.getElementById("search_upload_confirm_popup").style.display = "block";
	document.getElementById("search_upload").style.display = "none";
	document.getElementById("search_upload_confirm_title").innerHTML = "Update Autopilot '" + autopilot_title + "'";
	document.getElementById("search_upload_confirm_text").value = "";

	return;
}

function close_search_upload_confirm() {
	document.getElementById("search_upload_confirm_popup").style.display = "none";
	document.getElementById("search_upload").style.display = "flex";
}

function update_csv_searches() {
	if (document.getElementById("search_upload_autopilot_picker").value == 0) {
		return;
	}
	if (document.getElementById("search_upload_confirm_text").value != "DO IT") {
		alert("You must type 'DO IT' in the input field to continue");
		return;
	}
	for (var i = 0; i < csv_autopilots[csv_autopilots_index].searches.length; i++) {
		if (csv_changes.unchanged.indexOf(i) > -1) {
			continue;
		}
		var cur_search = csv_autopilots[csv_autopilots_index].searches[i];
		if (cur_search.search.trim().indexOf("https://www.youtube.com/") == 0) {
			var channel_id = get_youtube_channel_id(cur_search.search);
			if (channel_id != "") {
				cur_search.search = "youtube channel " + channel_id;
			}
		}
		cur_search.search = cur_search.search.replace(hyphen_re, "-");
		cur_search.search = cur_search.search.replace(/\|/g, "_");
		cur_autopilot.search_terms_split.push(cur_search.search.trim());
		console.log("adding search: " + cur_search.search.trim());
		cur_autopilot.search_terms_date_split.push(-1);
		cur_autopilot.search_terms_title_split.push("");
		cur_autopilot.hashtags.search.push({fixed: cur_search.fixed, variable: cur_search.variable, variable_count: cur_search.variable_count});
	}
	for (var i = csv_changes.deleted.length - 1; i >= 0; i--) {
		var index = csv_changes.deleted[i];
		console.log("deleting search: " + cur_autopilot.search_terms_split[index]);
		cur_autopilot.search_terms_split.splice(index, 1);
		cur_autopilot.search_terms_date_split.splice(index, 1);
		cur_autopilot.search_terms_title_split.splice(index, 1);
		cur_autopilot.hashtags.search.splice(index, 1);
	}
	cur_autopilot.hashtags_string = JSON.stringify(cur_autopilot.hashtags)
	close_search_upload_confirm();
	finish_save_autopilot(false);
	process_csv_autopilots();
}

function save_autopilot() {
	options_add_exclude(document.getElementById('easy_search_options_domain_autopilot').value);
	cur_autopilot.title = document.getElementById("autopilot_title").value.trim();
	cur_autopilot.email = document.getElementById("autopilot_email_schedule_email").value.trim();
	autopilot_add_categories();
	cur_autopilot.categories = categories_split;

	if (cur_autopilot.title == "") {
		show_message("You need to enter a title for this AutoPilot", true, 0, "block");
		return;
	}

	for (var i = 0; i < autopilot_list.autopilots.length; i++) {
		if (cur_autopilot.autopilot_id == autopilot_list.autopilots[i].autopilot_id) {
			continue;
		}
		if (cur_autopilot.title.trim() == autopilot_list.autopilots[i].title.trim()) {
			show_message("You already have an AutoPilot named '" + cur_autopilot.title.trim() + "', please pick another name", true, 0, "block");
			return;
		}
	}

	if (cur_autopilot.search_terms_split.length == 0) {
		show_message("You need to enter at least one search for this AutoPilot", true, 0, "block");
		return;
	}

	if (cur_autopilot.service == 15 && document.getElementById("autopilot_users").value == -1) {
		show_message("You need to select a User for this AutoPilot", true, 0, "block");
		return;
	}
	if (cur_autopilot.categories.length == 0) {
		document.getElementById("autopilot_create_category").value = cur_autopilot.title;
		autopilot_create_category_finish();
	}

	var pending = 0;
	var hide = -1;
	for (var i = 0; i < category_list.length; i++) {
		if (category_list[i].term_id == categories_split[0].term_id) {
			if (category_list[i].pending == 2) {
				pending = 2;
			} else if (category_list[i].pending == -1 && pending == 0) {
				pending = -1;
			}
			if (category_list[i].hide == 1 && hide == -1) {
				hide = 1;
			} else {
				hide = 0;
			}
		}
	}
	var popup_message = "";

	if (pending == -1) {
		popup_message = "<div style='text-align: left;font-size: 18px'><b>Warning:</b> This Category is set to Draft mode. All posts will be in Draft Mode until they are Published in the Posts tab.</div>";
	} else if ( pending == 2) {
		popup_message = "<div style='text-align: left;font-size: 18px'><b>Warning:</b> This Category is set to Draft/Publish Trust mode. All posts will be in Draft Mode unless they come from a Trusted Source.</div>";
	}
	if (hide == 1) {
		popup_message = popup_message + "<div style='text-align: left;font-size: 18px;margin-top: 8px'><b>Category set to Hide in Main Vlog Roll:</b> Posts will not display in your vlog unless you create a menu link to this Category.</div>";
	}

	if (popup_message != "") {
		show_confirm(popup_message, finish_save_autopilot, "Yes", true);
	} else {
		finish_save_autopilot();
	}
}

var is_saving = false;
function finish_save_autopilot(reload = true) {
	hide_message();
	cur_autopilot.search_terms = cur_autopilot.search_terms_split.join("|");
	if (reload) {
		options_add_exclude(document.getElementById('easy_search_options_domain_autopilot').value);
		cur_autopilot.title = document.getElementById("autopilot_title").value.trim();
		cur_autopilot.email = document.getElementById("autopilot_email_schedule_email").value.trim();
		cur_autopilot.categories = categories_split;
		cur_autopilot.user = document.getElementById("autopilot_users").value;
	}

	var url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";

	var requeststring = "id=" + license_key + "&set_autopilot=" + encodeURIComponent(JSON.stringify(cur_autopilot)) + "&server_id=" + server_id;

	show_busy("Saving AutoPilot...");
	dirty = false;
	console.log("resqueststring: " + requeststring);
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			//hide_busy();
			if (this.status == 200) {
				update_autopilots(true);

				save_state();
				clear_shake_error(document.getElementById("autopilot_form"));

				if (reload) {
					window.scrollTo(0,0);
					if (window.location.href.indexOf("force") > 0) {
						window.location.reload();
					} else {
						window.location = window.location.href.replace("#", "") + "&saved=1";
					}
				}
				is_saving = false;
			} else {
				console.log("save_autopilot error: " + this.status);
				show_message("There was an error saving this autopilot - please try again", true, 0, "block");
				is_saving = false;
			}
		}
	};

	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);
	is_saving = true;
}

function delete_autopilot() {
	show_confirm("Are you sure you want to delete this autopilot?", confirm_delete_autopilot, "OK", false);
}

function confirm_delete_autopilot() {
	var url = 'https://www.mondoplayer.com/cgi-bin/autopilot.cgi';
	var requeststring = "id=" + license_key + "&delete_autopilot=" + cur_autopilot.autopilot_id + "&server_id=" + server_id;

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "1") {
		show_message("There was an error deleting the autopilot.  Please try again", true, 0, "block");
		return;
	} else if (xmlhttp.responseText == "403") {
		console.log("confirm_delete_autopilot: 403");
		log_back_in();
		return;
	}

	dirty = false;

	update_autopilots(true);

	save_state();

	hide_message();
	window.location= "admin.php?page=mondoplayer_menu_autopilot_slug";
}

function toggle_buttons(cur_button) {
	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i] == cur_button) {
			document.getElementById(buttons[i]).classList.add("tag_button_inverse");
		} else {
			document.getElementById(buttons[i]).classList.remove("tag_button_inverse");
		}
	}
}

function show_home(history) {
	if (dirty) {
		return;
	}
	update_related_streams(false);
	update_topics(false);

	if (history) {
		toggle_buttons("history_button");
		state.related_streams.list.sort(function(a, b) {
			if (parseFloat(a.age) < parseFloat(b.age) || (parseFloat(a.age) == parseFloat(b.age) && a.title > b.title)) {
				return 1;
			} else {
				return -1;
			}
		});

	} else {
		toggle_buttons("home_button");
		state.related_streams.list.sort(function(a, b) {
			if (parseFloat(a.score) < parseFloat(b.score) || (parseFloat(a.score) == parseFloat(b.score) && a.title > b.title)) {
				return 1;
			} else {
				return -1;
			}
		});
	}
	remove_all_children(document.getElementById("left_content_bottom"));

	var tag_count = 0;

	for (var i = 0; i < state.related_streams.list.length; i++) {
		if (state.related_streams.list[i].title.trim() == "") {
			continue;
		}
		if (history && state.related_streams.list[i].age == 0) {
			continue;
		}
		tag_count++;
		var tag = document.createElement("div");
		tag.classList.add("tag");

		var tag_internal = document.createElement("div");
		tag_internal.classList.add("tag_internal");

		var element_left = document.createElement("div");
		element_left.id = "tag_" + state.related_streams.list[i].title;
		element_left.setAttribute("search_term", state.related_streams.list[i].title);
		var label_text = state.related_streams.list[i].title.substr(0,40);
		if (state.related_streams.list[i].title.length > 40) {
			label_text = label_text + "...";
		}
		element_left.innerHTML = label_text;
		element_left.classList.add("tag_left");

		element_left.addEventListener("click", function(event) {
			state.search_alert_id = 0;
			do_search(event.target.getAttribute("search_term"));
		});

		tag_internal.appendChild(element_left);

		var element_right = document.createElement("div");
		element_right.id = "tag2_" + state.related_streams.list[i].title;
		element_right.setAttribute("search_term", state.related_streams.list[i].title);
		if (state.favourites.list.indexOf(state.related_streams.list[i].title.trim().toUpperCase()) >= 0) {
			element_right.innerHTML = "<img class='star_img' src='" + image_url + "tag_star_on_blank.png' search_term='" + state.related_streams.list[i].title + "' />";
		} else {
			element_right.innerHTML = "<img class='star_img' src='" + image_url + "tag_star_off_blank.png' search_term='" + state.related_streams.list[i].title + "' />";
		}
		element_right.classList.add("tag_right");

		element_right.addEventListener("click", function(event) {
			toggle_favourites(event.target.getAttribute("search_term"));
			show_home(false);
		});

		tag_internal.appendChild(element_right);
		tag.appendChild(tag_internal);

		document.getElementById("left_content_bottom").appendChild(tag);
	}

	left_content_bottom_more(tag_count);

	if (state.search_results.length > 0) {
		show_approved = false;
		draw_search_results(-1);
	}
}

function toggle_favourites(search_term) {
	search_term = search_term.trim().toUpperCase();
	if (state.favourites.list.indexOf(search_term) >= 0) {
		state.favourites.list.splice(state.favourites.list.indexOf(search_term), 1);
	} else {
		state.favourites.list.push(search_term);
	}
	state.favourites.date = Date.now() / 1000;

	var favourite_string = state.favourites.list.join("\n");

	var url = 'https://www.mondoplayer.com/cgi-bin/search.cgi?save_favourites=' + encodeURIComponent(favourite_string) + "&id=" + license_key;

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();

	if (xmlhttp.responseText == "403") {
		console.log("toggle_favourites: 403");
		log_back_in();
		return;
	}
	save_state();
}

function add_new_autopilot() {
	hide_message();
	edit_autopilot(0);
}

function clear_initial_video() {
	document.getElementById("video_popup").style.display = "none";
}

function show_autopilots() {
	//toggle_buttons("autopilots_button");
	window.scrollTo(0,0);
	update_autopilots(true);

	//remove_all_children(document.getElementById("left_content_bottom"));
	remove_all_children(document.getElementById("autopilots_list"));
	var tag = document.createElement("div");
	tag.classList.add("tag_full");
	tag.classList.add("tag_small");
	tag.innerHTML = "Add AutoPilot"

	tag.addEventListener("click", function(event) {
		edit_autopilot(0);
	});

	document.getElementById("autopilots_list").appendChild(tag);

	//edit_autopilot(0);

	var tag_count = 0;

	if (state.autopilots.list.length > 0) {
		document.getElementById("autopilots_content").style.display = "none";
	}

	for (var i = 0; i < state.autopilots.list.length; i++) {
		var tag = document.createElement("div");
		tag.classList.add("tag");

		tag_count++;

		var tag_internal = document.createElement("div");
		tag_internal.classList.add("tag_internal");

		var element_left = document.createElement("div");
		element_left.id = "autopilot_" +  state.autopilots.list[i].autopilot_id;
		element_left.setAttribute("autopilot_id",  state.autopilots.list[i].autopilot_id);
		var label_text = state.autopilots.list[i].title.substr(0,40);
		if (state.autopilots.list[i].title.length > 40) {
			label_text = label_text + "...";
		}
		element_left.innerHTML = label_text;
		element_left.classList.add("tag_left");

		element_left.addEventListener("click", function(event) {
			edit_autopilot(event.target.getAttribute("autopilot_id"));
		});

		tag_internal.appendChild(element_left);

		var element_right = document.createElement("div");
		element_right.id = "autopilot2_" + state.autopilots.list[i].autopilot_id;
		element_right.setAttribute("autopilot_id", state.autopilots.list[i].autopilot_id);
		element_right.innerHTML = "<img class='edit_img' src='" + image_url + "tag_edit_on_blank.png' autopilot_id='" + state.autopilots.list[i].autopilot_id + "' />";
		element_right.classList.add("tag_right");

		element_right.addEventListener("click", function(event) {
			edit_autopilot(event.target.getAttribute("autopilot_id"));
		});

		tag_internal.appendChild(element_right);
		tag.appendChild(tag_internal);

		document.getElementById("autopilots_list").appendChild(tag);
	}

	//left_content_bottom_more(tag_count);
}

function show_topics() {
	if (dirty) {
		return;
	}
	document.getElementById("topic_page").appendChild(document.getElementById("topic_form"));

	toggle_buttons("topics_button");
	update_topics(false);
	//remove_all_children(document.getElementById("left_content_bottom"));
	remove_all_children(document.getElementById("topics_list"));

	var tag = document.createElement("div");
	tag.classList.add("tag_full");
	tag.classList.add("tag_small");
	tag.innerHTML = "Add Topic"

	tag.addEventListener("click", function(event) {
		edit_topic(0);
	});

	//edit_topic(0);

	document.getElementById("topics_list").appendChild(tag);
	var tag_count = 0;


	var topics_sort = new Array();
	for (var i in state.topics.list) {
		if (! state.topics.list.hasOwnProperty(i)) {
			continue;
		}

		if (state.topics.list[i].adhoc == 1) {
			continue;
		}
		topics_sort.push([state.topics.list[i].alert_id, i]);
	}
	topics_sort.sort(function(a,b) {return b[0] - a[0]});

	for (var t = 0;t < topics_sort.length; t++) {
		var i = topics_sort[t][1];
//		if (! state.topics.list.hasOwnProperty(i)) {
//			continue;
//		}

//		if (state.topics.list[i].adhoc == 1) {
//			continue;
//		}

		tag_count++;
		var tag = document.createElement("div");
		tag.classList.add("tag");

		var tag_internal = document.createElement("div");
		tag_internal.classList.add("tag_internal");

		var element_left = document.createElement("div");
		element_left.id = "topic_" +  state.topics.list[i].alert_id;
		var cur_search_terms = "";
		for (var s = 0; s < state.topics.list[i].search_terms.length; s++) {
			if (state.topics.list[i].search_terms[s].trim() != "") {
				cur_search_terms = cur_search_terms + '"' + state.topics.list[i].search_terms[s].trim() + '" ';
			}
		}
		cur_search_terms = cur_search_terms.trim();
		if (cur_search_terms.charAt(0) == '"' && cur_search_terms.charAt(cur_search_terms.length - 1) == '"') {
			cur_search_terms = cur_search_terms.substring(1,cur_search_terms.length - 1);
		}
		element_left.setAttribute("search_terms", cur_search_terms);
		element_left.setAttribute("topic_id", state.topics.list[i].alert_id);
		element_left.innerHTML = state.topics.list[i].alert_title;
		element_left.classList.add("tag_left");

		element_left.addEventListener("click", function(event) {
			state.search_alert_id = state.topics.list[i].alert_id;
			show_page('search_page');
			do_search(event.target.getAttribute("search_terms"));
		});

		tag_internal.appendChild(element_left);

		var element_right = document.createElement("div");
		element_right.id = "topic2_" + state.topics.list[i].alert_id;
		element_right.setAttribute("topic_id", state.topics.list[i].alert_id);
		element_right.innerHTML = "<img class='edit_img' src='" + image_url + "tag_edit_on_blank.png' topic_id='" + state.topics.list[i].alert_id + "' />";
		element_right.classList.add("tag_right");

		element_right.addEventListener("click", function(event) {
			edit_topic(event.target.getAttribute("topic_id"));
		});

		tag_internal.appendChild(element_right);
		tag.appendChild(tag_internal);

		document.getElementById("topics_list").appendChild(tag);
	}

	left_content_bottom_more(tag_count);
}

function draw_topics() {
	update_topics(false);
	remove_all_children(document.getElementById("topics_list"));
	if (document.getElementById("save_search_list") != null) {
		remove_all_children(document.getElementById("save_search_list"));
	}
	var topics_sort = new Array();
	for (var i in state.topics.list) {
		if (! state.topics.list.hasOwnProperty(i)) {
			continue;
		}

		if (state.topics.list[i].adhoc == 1) {
			continue;
		}
		topics_sort.push([state.topics.list[i].alert_id, i]);
	}
	topics_sort.sort(function(a,b) {return b[0] - a[0]});

	for (var t = 0;t < topics_sort.length; t++) {
		var i = topics_sort[t][1];
		var tag = document.createElement("div");
		tag.classList.add("tag");

		var tag_internal = document.createElement("div");
		tag_internal.classList.add("tag_internal");

		var element_left = document.createElement("div");
		element_left.id = "topic_" +  state.topics.list[i].alert_id;
		var cur_search_terms = "";
		for (var s = 0; s < state.topics.list[i].search_terms.length; s++) {
			if (state.topics.list[i].search_terms[s].trim() != "") {
				cur_search_terms = cur_search_terms + '"' + state.topics.list[i].search_terms[s].trim() + '" ';
			}
		}
		cur_search_terms = cur_search_terms.trim();
		if (cur_search_terms.charAt(0) == '"' && cur_search_terms.charAt(cur_search_terms.length - 1) == '"') {
			cur_search_terms = cur_search_terms.substring(1,cur_search_terms.length - 1);
		}

		element_left.setAttribute("title", state.topics.list[i].alert_title);
		element_left.setAttribute("search_terms", cur_search_terms);
		element_left.setAttribute("topic_id", state.topics.list[i].alert_id);
		element_left.innerHTML = state.topics.list[i].alert_title;
		element_left.classList.add("tag_left");

		element_left.addEventListener("click", function(event) {
			do_search(event.target.getAttribute("search_terms"));
		});

		tag_internal.appendChild(element_left);

		var element_right = document.createElement("div");
		element_right.id = "topic2_" + state.topics.list[i].alert_id;
		element_right.setAttribute("search_terms", cur_search_terms);
		element_right.setAttribute("topic_id", state.topics.list[i].alert_id);
		element_right.setAttribute("title", state.topics.list[i].alert_title);
		var img = document.createElement("img");
		element_right.classList.add("tag_right");
		element_right.innerHTML = "X";
		element_right.addEventListener("click", function(event) {
			cur_topic.alert_id = event.target.getAttribute("topic_id");
			delete_topic( event.target.getAttribute("title"));
		});

		tag_internal.appendChild(element_right);
		tag.appendChild(tag_internal);

		document.getElementById("topics_list").appendChild(tag);
		if (document.getElementById("save_search_list") != null) {
			var list_tag = document.createElement("div");
			list_tag.classList.add("tag");

			var list_element = document.createElement("div");
			list_element.id = "search_list_" +  state.topics.list[i].alert_id;
			list_element.setAttribute("title", state.topics.list[i].alert_title);
			list_element.setAttribute("topic_id", state.topics.list[i].alert_id);
			list_element.innerHTML = state.topics.list[i].alert_title;
			list_element.classList.add("tag_left");
			list_element.addEventListener("click", function(event) {
				save_search(event.target.getAttribute("topic_id"), event.target.getAttribute("title"));
			});
			list_tag.appendChild(list_element);
			document.getElementById("save_search_list").appendChild(list_tag);
		}
	}
}

function show_favourites() {
	toggle_buttons("favourites_button");
	update_favourites(false);
	remove_all_children(document.getElementById("left_content_bottom"));
	var tag_count = 0;
	for (var i = 0; i < state.favourites.list.length; i++) {
		var tag = document.createElement("div");
		tag.classList.add("tag");

		tag_count++;

		var tag_internal = document.createElement("div");
		tag_internal.classList.add("tag_internal");

		var element_left = document.createElement("div");
		element_left.id = "tag_" + state.favourites.list[i];
		element_left.setAttribute("search_term", state.favourites.list[i]);
		var label_text = state.favourites.list[i].substr(0,40);
		if (state.favourites.list[i].length > 40) {
			label_text = label_text + "...";
		}
		element_left.innerHTML = label_text;
		element_left.classList.add("tag_left");

		element_left.addEventListener("click", function(event) {
			state.search_alert_id = 0;
			do_search(event.target.getAttribute("search_term"));
		});

		tag_internal.appendChild(element_left);

		var element_right = document.createElement("div");
		element_right.id = "tag2_" + state.favourites.list[i];
		element_right.setAttribute("search_term", state.favourites.list[i]);
		element_right.innerHTML = "<img class='star_img' src='" + image_url + "tag_star_on_blank.png' search_term='" + state.favourites.list[i] + "' />";
		element_right.classList.add("tag_right");

		element_right.addEventListener("click", function(event) {
			toggle_favourites(event.target.getAttribute("search_term"));
			show_favourites(false);
		});

		tag_internal.appendChild(element_right);
		tag.appendChild(tag_internal);

		document.getElementById("left_content_bottom").appendChild(tag);
	}

	left_content_bottom_more(tag_count);
}

function left_content_bottom_more(tag_count) {
	document.getElementById("left_content_bottom_more_below").innerHTML = "▼";
	document.getElementById("left_content_bottom").classList.add("left_content_closed");
	document.getElementById("left_content_bottom").classList.remove("left_content_open");
	document.getElementById("left_content_bottom_more_below").style.display = "block";
	if (tag_count > 9) {
		//document.getElementById("left_content_bottom_more_below").style.display = "block";
		document.getElementById("left_content_bottom_more_above").style.display = "none";
	} else {
		//document.getElementById("left_content_bottom_more_below").style.display = "none"
	}
}

function toggle_left_content() {
	if (document.getElementById("left_content_bottom_more_below").innerHTML == "▼") {
		document.getElementById("left_content_bottom_more_below").innerHTML = "▲";
		document.getElementById("left_content_bottom").classList.remove("left_content_closed");
		document.getElementById("left_content_bottom").classList.add("left_content_open");
		document.getElementById("left_content_bottom_more_above").style.display = "block";
	} else {
		document.getElementById("left_content_bottom_more_below").innerHTML = "▼";
		document.getElementById("left_content_bottom").classList.add("left_content_closed");
		document.getElementById("left_content_bottom").classList.remove("left_content_open");
		document.getElementById("left_content_bottom_more_above").style.display = "none";
	}
}

var cur_options_excluded_domains;
var cur_options_excluded_search_terms;
var cur_options_excluded_meta_tags;
function show_options() {
	update_options(false);
	document.getElementById("playOnlyDuringWifi").checked = state.options.playOnlyDuringWifi == 1;
	document.getElementById("playDuringRoaming").checked = state.options.playDuringRoaming == 1;
	document.getElementById("onlyPostVideosWithThumbnails").checked = state.options.onlyPostVideosWithThumbnails == 1;
	document.getElementById("ignore_original_tags").checked = state.options.ignore_original_tags == 1;
	document.getElementById("notification").checked = state.options.notification == 1;
	document.getElementById("emailFlag").checked = state.options.emailFlag == 1;
	if (state.options.content_filters.substr(0,1) == "1") {
		document.getElementById("content_filter_gore").checked = true;
	} else {
		document.getElementById("content_filter_gore").checked = false;
	}
	if (state.options.content_filters.substr(1,1) == "1") {
		document.getElementById("content_filter_profanity").checked = true;
	} else {
		document.getElementById("content_filter_profanity").checked = false;
	}
	if (state.options.content_filters.substr(2,1) == "1") {
		document.getElementById("content_filter_religion").checked = true;
	} else {
		document.getElementById("content_filter_religion").checked = false;
	}
	if (state.options.content_filters.substr(3,1) == "1") {
		document.getElementById("content_filter_sex").checked = true;
	} else {
		document.getElementById("content_filter_sex").checked = false;
	}
	if (state.options.content_filters.substr(4,1) == "1") {
		document.getElementById("content_filter_violence").checked = true;
	} else {
		document.getElementById("content_filter_violence").checked = false;
	}
	options_draw_excluded_domains();
	options_draw_trusted_domains();
	show_autopilot_messages(-1);
}
function parse_advanced_search(search_term) {
	var search_term_all = "";
	var search_term_youtube = "";
	var search_term_any = "";
	var search_term_hashtag = "";
	var search_term_quoted = "";
	var search_term_none = "";
	var search_embed = 0;

	if (search_term == null || search_term.trim() == "") {
	//	return;
	} else {
		search_term.replace(/“/g, '"');
		search_term.replace(/”/g, '"');

		var quoted = search_term.match(/[^\s"]+|"[^"]+"/g);
		var next_negated = false;
		var next_youtube = -1;
		for (var i = 0;i < quoted.length; i++) {
			if (quoted[i].toLowerCase() == "youtube" && next_youtube == -1) {
				next_youtube = 0;
				continue;
			}
			if (quoted[i].toLowerCase() == "channel" && next_youtube == 0) {
				next_youtube = 1;
				continue;
			}
			if (next_youtube == 1) {
				search_term_youtube = "youtube channel " + quoted[i];
				next_youtube = -1;
				continue;
			}
			next_youtube = -1;

			if (quoted[i].toLowerCase() == "&embed" && search_embed == 0) {
				search_embed = 1;
				continue;
			}
			if (quoted[i].toLowerCase() == "&vlog") {
				search_embed = 2;
				continue;
			}
			if (quoted[i].toLowerCase() == "or") {
				continue;
			}
			if (quoted[i] == "-") {
				next_negated = true;
				continue;
			}
			if (quoted[i].substr(0,1) == "-" || next_negated) {
				if (search_term_none != "") {
					search_term_none = search_term_none + " ";
				}

				if (next_negated) {
					search_term_none = search_term_none + quoted[i];
				} else {
					search_term_none = search_term_none + quoted[i].substr(1);
				}
				next_negated = false;
				continue;
			}
			if ((i > 0 && quoted[i - 1].toLowerCase() == "or") || (i < quoted.length - 1 && quoted[i + 1].toLowerCase() == "or")) {
				if (search_term_any != "") {
					search_term_any = search_term_any + " ";
				}
				search_term_any = search_term_any + quoted[i];
				continue;
			}
			if (quoted[i].substr(0,1) == '"' && search_term_quoted == "") {
				search_term_quoted = search_term_quoted + quoted[i].replace(/"/g, '');
				continue;
			}
			//if (quoted[i].substr(0,1) == "#") {
			//	if (search_term_hashtag != "") {
			//		search_term_hashtag = search_term_hashtag + " ";
			//	}
			//	search_term_hashtag = search_term_hashtag + quoted[i].substr(1);
			//	continue;
			//}
			if (search_term_all != "") {
				search_term_all = search_term_all + " ";
			}
			search_term_all = search_term_all + quoted[i];
		}
	}
	if (document.getElementById("easy_search_all")) {
		document.getElementById("easy_search_all").value = search_term_all;
		document.getElementById("easy_search_youtube").value = search_term_youtube;
		document.getElementById("easy_search_hash").value = search_term_hashtag;
		document.getElementById("easy_search_phrase").value = search_term_quoted;
		document.getElementById("easy_search_any").value = search_term_any;
		document.getElementById("easy_search_none").value = search_term_none;
		document.getElementById("search_entry").value = search_term;
		document.getElementById("search_embed_" + search_embed).checked = true;
	}
}

function do_search(search_term) {
	if (search_term.trim() == "") {
		return;
	}

	parse_advanced_search(search_term)
	document.getElementById("search_entry").value = search_term;
	if (document.getElementById("right_panel_content") == null) {
		return;
	}

	document.getElementById("right_panel_suggestions").style.display = "none";
	search_term = search_term.replace(hyphen_re, "-");
	search_term = search_term.replace(/\|/g, "_");
	if (search_term == state.search_term) {
		fetch_search_results(false);
		return;
	}
	search_term = search_term.trim();

	if (typeof state.show_learning === "undefined" || state.show_learning != 3) {
		document.getElementById("learning_message").style.display = "none";
		document.getElementById("learning_complex").style.display = "none";
		document.getElementById("show_learning").checked = false;
		var search_term_split = search_term.split(" ");

		if (search_term_split.length > 2) {
			document.getElementById("learning_complex").style.display = "block";
		}
		if (typeof state.show_learning === "undefined") {
			document.getElementById("learning_message").style.display = "block";
		}

		if (document.getElementById("learning_message").style.display == "block" || document.getElementById("learning_complex").style.display == "block" ) {
			document.getElementById("right_panel_learning").style.display = "block";
			document.getElementById("right_panel_output").style.display = "none";
		}
	}

	for (var i = 0; i < state.related_streams.list.length; i++) {
		if (state.related_streams.list[i].title.trim() == search_term) {
			state.related_streams.list[i].age = Math.floor(Date.now() / 1000);
			break;
		}
	}
	var url = "https://www.mondoplayer.com/cgi-bin/search.cgi";

	var requeststring = "id=" + license_key + "&platform=1&get_search=" + encodeURIComponent(search_term);
	if (document.getElementById("sort_by_date").checked) {
		requeststring = requeststring + "&sort_by_date=1";
	}
	if (document.getElementById("include_previously_posted").checked) {
		requeststring = requeststring + "&include_previously_posted=" + document.getElementById("include_previously_posted").value;
	}

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("do_search: 403");
		log_back_in();
		return;
	}
	var search_return = JSON.parse(xmlhttp.responseText);
	state.search_id = search_return.search_id;
	console.log ("new_search: " + search_return.new_search + " - " + state.isAccountSubscribed );
	if (search_return.new_search == 1 && state.isAccountSubscribed == 1) {
		search_return.new_search == 0;
		document.getElementById("right_panel_new_search").style.display = "block";
		document.getElementById("right_panel_new_search_notify").style.display = "none";
	} else {
		document.getElementById("right_panel_new_search").style.display = "none";
		document.getElementById("right_panel_new_search_notify").style.display = "none";
	}
	state.search_term = search_term;
	document.getElementById("search_entry").value = search_term;
	if (state.search_id == 0) {
		show_message("There was an error fetching this search.  Please try again.", true, 0, "block");
		return;
	}
	var new_search_results = new Array();
	var order = 0;
	state.search_results.sort(function(a, b) {
		if (a.order < b.order) {
			return -1;
		} else {
			return 1;
		}
	});
	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			state.search_results[i].index = order;
			state.search_results[i].order = order;
			state.search_results[i].old_approved = true;
			order++;
			new_search_results.push(state.search_results[i]);
		}
	}

	state.search_results = new_search_results;
	save_state();
	fetch_search_results();
}

function fetch_search_results() {
	var url = "https://www.mondoplayer.com/cgi-bin/search.cgi";
	requeststring = "platform=1&get_objects=" + state.search_id + "&id=" + license_key;

	window.scrollTo(0, 0);
	//for (var t = 0; t < 2; t++) {
		var xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("POST", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.setRequestHeader("Accept", "text/plain");
		xmlhttp.send(requeststring);

		if (xmlhttp.responseText == "403") {
			console.log("fetch_search_results: 403");
			log_back_in();
			return;
		}

		var parser = new DOMParser();
		var cur_search_doc = parser.parseFromString(xmlhttp.responseText, "text/xml");
		var media = cur_search_doc.getElementsByTagName("Media");

		var anchor = document.createElement("a");

		var approve_count = state.search_results.length;

		for (var i = 0; i < media.length; i++) {
			var cur_media = new Object();
			cur_media.approved = false;
			cur_media.old_approved = false;
			cur_media.title = media[i].getAttribute("Title");
			cur_media.media_id = media[i].getAttribute("ID");
			cur_media.url = media[i].getAttribute("SourceURL");
			cur_media.anchor = media[i].getAttribute("Anchor");
			cur_media.thumbnail_url = media[i].getAttribute("ThumbnailUrl");
			cur_media.embedVideo = media[i].getAttribute("EmbedVideo");
			anchor.href = media[i].getAttribute("SourceURL");
			cur_media.hostname = anchor.hostname;
			cur_media.order = i + approve_count;
			cur_media.index = i + approve_count;
			cur_media.search_terms = state.search_term;
			cur_media.alert_id = state.search_alert_id;
			var date_string = media[i].getAttribute("LastUpdated");
			var d = date_parse(date_string);
			cur_media.last_update = d.toString();;
			state.search_results.push(cur_media);
		}
	//}
	state.search_results_date = Math.round(new Date().getTime()/1000);
	show_approved = false;
	toggle_show_approved(true);
	draw_search_results(-1);
}

function toggle_sort_order() {
	draw_search_results(cur_result_page);
}

var cur_result_page = 0;
var show_approved = false;
function draw_search_results(page) {
	var results_per_page = 10;
	if (state.search_results_date < (Math.round(new Date().getTime()/1000) - 1800)) {
		state.search_results = new Array();
	}
	remove_all_children(document.getElementById("right_panel_content"));
	remove_all_children(document.getElementById("right_panel_pages"));
	remove_all_children(document.getElementById("right_panel_pages_bottom"));

	var search_result_pages = Math.ceil(state.search_results.length/results_per_page);

	var object_count = 0;
	for (var i = 0; i < state.search_results.length; i++) {
		if (show_approved) {
			if (state.search_results[i].approved) {
				object_count++;
			}
		} else {
			if (! state.search_results[i].old_approved) {
				object_count++;
			}
		}
	}
	if (object_count == 0) {
		return;
	}
	search_result_pages = Math.ceil(object_count/results_per_page);

	if (page == -1) {
		page = search_result_pages;
	}
	cur_result_page = page;

	var last_page = 1;

	document.getElementById("show_approved_button").style.display = "inline-block";
	document.getElementById("show_approved_button_bottom").style.display = "inline-block";
	set_show_approved_button_state();

	if (search_result_pages > 1) {
		var label = document.createElement("div");
		label.classList.add("page_button_text");
		label.innerHTML = "Page:&nbsp;&nbsp;";

		var label_bottom = label.cloneNode(true);
		document.getElementById("right_panel_pages").appendChild(label);
		document.getElementById("right_panel_pages_bottom").appendChild(label_bottom);

		var page1 = document.createElement("div");
		page1.innerHTML = "1";
		page1.classList.add("page_button");
		if (page == 1) {
			page1.classList.add("page_button_selected");
		}
		page1.addEventListener("click", function(event) {
			draw_search_results(1);
		});

		var page1_bottom = page1.cloneNode(true);
		page1_bottom.addEventListener("click", function(event) {
			draw_search_results(1);
		});

		document.getElementById("right_panel_pages").appendChild(page1);
		document.getElementById("right_panel_pages_bottom").appendChild(page1_bottom);
	}

	if (page > 4) {
		var ellipse = document.createElement("div");
		ellipse.classList.add("page_button_text");
		ellipse.innerHTML = "...";

		var ellipse_bottom = ellipse.cloneNode(true);
		document.getElementById("right_panel_pages").appendChild(ellipse);
		document.getElementById("right_panel_pages_bottom").appendChild(ellipse_bottom);
	}

	var min = page - 2;
	if (min > search_result_pages - 4) {
		min = search_result_pages - 4;
	}
	if (min < 2) {
		min = 2;
	}

	for (var i = min; i < min + 5; i++) {
		if (i > search_result_pages) {
			break;
		}
		var div = document.createElement("div");
		div.innerHTML = i;
		div.classList.add("page_button");
		div.setAttribute("page", i);
		if (page == i) {
			div.classList.add("page_button_selected");
		}
		div.addEventListener("click", function(event) {
			draw_search_results(this.getAttribute("page"));
		});

		last_page = i;

		var div_bottom = div.cloneNode(true);
		div_bottom.addEventListener("click", function(event) {
			draw_search_results(this.getAttribute("page"));
		});

		document.getElementById("right_panel_pages").appendChild(div);
		document.getElementById("right_panel_pages_bottom").appendChild(div_bottom);
	}

	if (last_page < search_result_pages - 1) {
		var ellipse = document.createElement("div");
		ellipse.classList.add("page_button_text");
		ellipse.innerHTML = "...";
		var ellipse_bottom = ellipse.cloneNode(true);
		document.getElementById("right_panel_pages").appendChild(ellipse);
		document.getElementById("right_panel_pages_bottom").appendChild(ellipse_bottom);

	}

	if (last_page < search_result_pages) {
		var div = document.createElement("div");
		div.innerHTML = search_result_pages;
		div.classList.add("page_button");
		div.setAttribute("page", search_result_pages);
		if (page == search_result_pages) {
			div.classList.add("page_button_selected");
		}
		div.addEventListener("click", function(event) {
			draw_search_results(this.getAttribute("page"));
		});

		var div_bottom = div.cloneNode(true);
		div_bottom.addEventListener("click", function(event) {
			draw_search_results(this.getAttribute("page"));
		});
		document.getElementById("right_panel_pages").appendChild(div);
		document.getElementById("right_panel_pages_bottom").appendChild(div_bottom);

	}

	if (show_approved == false) {
		var div = document.createElement("div");
		div.innerHTML = "More...";
		div.classList.add("page_button");
		div.addEventListener("click", function(event) {
			fetch_search_results();
		});

		var div_bottom = div.cloneNode(true);
		div_bottom.addEventListener("click", function(event) {
			fetch_search_results();
		});
		document.getElementById("right_panel_pages").appendChild(div);
		document.getElementById("right_panel_pages_bottom").appendChild(div_bottom);
	}

	var start = (page - 1) * results_per_page;
	var cur_date = new Date();

	var count = 0;
	var i = start;

	if (show_approved) {
		state.search_results.sort(function(a, b) {
			if (a.order > b.order) {
				return -1;
			} else {
				return 1;
			}
		});
	} else {
		state.search_results.sort(function(a, b) {
			if (a.index < b.index) {
				return -1;
			} else {
				return 1;
			}
		});
	}


	var i_obj = new Array();

	while (count < results_per_page) {
		if (i >= state.search_results.length) {
			break;
		}
		if (show_approved && !state.search_results[i].approved) {
			i++;
			continue;
		}
		if (! show_approved && state.search_results[i].old_approved) {
			i++;
			continue;
		}
		var last_update = new Date(state.search_results[i].last_update);
		var seconds = (cur_date.getTime() - last_update.getTime())/1000;

		i_obj.push([i, seconds]);
		i++;
		count++;
	}

	if (document.getElementById("sort_by_date").checked) {
		i_obj.sort(function(a, b) {
			return a[1] - b[1];
		});
	}

	for (var ii = 0; ii < i_obj.length; ii++) {
		i = i_obj[ii][0];
		var last_update = new Date(state.search_results[i].last_update);
		var seconds = (cur_date.getTime() - last_update.getTime())/1000;
		if (seconds < 0) {
			seconds = 0;
		}
		var days = seconds/86400;
		var date_string = "";

		if (days > 365) {
			date_string = Math.floor(days / 365) + " years ago";
		} else if (days > 30) {
			date_string = Math.floor(days / 30) + " months ago";
		} else if (days > 7) {
			date_string = Math.floor(days / 7) + " weeks ago";
		} else if (days > 1) {
			date_string = Math.floor(days) + " days ago";
		} else if (seconds > 3600) {
			date_string = Math.floor(seconds / 3600) + " hours ago";
		} else if (seconds > 60) {
			date_string = Math.floor(seconds / 60) + " mins ago";
		} else {
			date_string = Math.floor(seconds) + " seconds ago";
		}

		var div = document.createElement("div");
		div.classList.add("search_result");
		div.id = "search_result_" + i;
		var approved;
		if (state.search_results[i].approved) {
			approved = "<div class='page_button topic_button_selected' id='approve_button_" + state.search_results[i].media_id + "' onclick='toggle_approved(" + i + ")'>Approved</div>";
		} else {
			approved = "<div class='approve_button_unselected page_button topic_button_unselected' id='approve_button_" + state.search_results[i].media_id + "' onclick='toggle_approved(" + i + ")'>Approve</div>";
		}
		var title;
		var second_line;
		var char_count = "";
		var order_buttons = "";
		if (show_approved) {
			div.classList.add("search_result_edit");
			title = "Title: <textarea class='form_field_input' id='edit_" + i + "' style='padding: 10px 16px' onfocus='show_hashtags(" + i + ")' onblur='setTimeout(\"hashtag_blur(" + i + ")\", 200);' onkeyup='edit_object(" + i + ")'>" + state.search_results[i].title + "</textarea><div id='hashtags_" + i + "' class='bulk_submit_hashtags'></div>";
			second_line = "<span class='search_result_date' style='width: 100%; max-width: 600px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;font-size: 13px'>" + state.search_results[i].url + "</span>";
			var count_color = "#141414";
			if (state.search_results[i].title.length > 260) {
				count_color = "red";
			}
			char_count = "<div style='display:inline-block;margin-right: 8px;color: " + count_color + "' id='count_" + i + "' >" + state.search_results[i].title.length + "</div>";
			order_buttons = "<div class='page_button order_button' id='down_button_" + state.search_results[i].media_id + "' onclick='order_down(" + i + ")'>&#9660;</div><div class='page_button order_button' id='up_button_" + state.search_results[i].media_id + "' onclick='order_up(" + i + ")'>&#9650;</div><br />";
		} else {
			title = "<span class='search_result_title'><a href='" + state.search_results[i].url + "' target='_blank'>" + state.search_results[i].title + "</a></span>";
			second_line = "<span class='search_result_date'>" + state.search_results[i].hostname + " - " + date_string + "</span>";
		}

		div.innerHTML = "<div class='search_result_content'>" + title + "<br />" + second_line + "</div><div class='search_result_buttons'>" + char_count + order_buttons + approved + "</div>";
		//document.getElementById("right_panel_content").insertBefore(div, document.getElementById("right_panel_content").firstChild);
		document.getElementById("right_panel_content").appendChild(div);
	}
}

function new_search_result(index) {
	if (index == 0) {
		document.getElementById("right_panel_new_search").style.display = "none";
		document.getElementById("right_panel_new_search_notify").style.display = "none";
	} else if (index == 1) {
		document.getElementById("right_panel_new_search").style.display = "none";
		document.getElementById("right_panel_new_search_notify").style.display = "block";
	} else if (index == 2) {
		document.getElementById("right_panel_new_search").style.display = "none";
		document.getElementById("right_panel_new_search_notify").style.display = "none";
		new_search_status(2);
	} else if (index == 3) {
		document.getElementById("right_panel_new_search").style.display = "none";
		document.getElementById("right_panel_new_search_notify").style.display = "none";
		new_search_status(1);
	}
}

function new_search_status(index) {
	var url = "https://www.mondoplayer.com/cgi-bin/search.cgi";

	var requeststring = "platform=1&new_search=" + state.search_id + "&status=" + index + "&id=" + license_key;

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);
	if (index == 2) {
		document.getElementById("right_panel_new_search_message").style.display = "block";
		document.getElementById("right_panel_new_search_message").style.opacity = 1;
		setTimeout("new_search_message_fade()", 5000);
	}
}
function new_search_message_fade() {
	document.getElementById("right_panel_new_search_message").style.opacity = 0;
	setTimeout("new_search_message_hide()", 500);
}
function new_search_message_hide() {
	document.getElementById("right_panel_new_search_message").style.display = "none";
}

function hashtag_blur(index) {
	if (document.getElementById("edit_" + index) === document.activeElement) {
	} else {
		document.getElementById('hashtags_' + index).style.display='none';
	}
}

function show_hashtags(cur_index) {
	var cur_hashtags = new Array();

	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved && typeof document.getElementById("edit_" + i) !== "undefined") {
			var temp_hashtags = document.getElementById("edit_" + i).value.match(/#\w+/g);
			cur_hashtags = cur_hashtags.concat(temp_hashtags);
		}
	}

	remove_all_children(document.getElementById("hashtags_" + cur_index));

	var new_hashtags = new Array();

	if (cur_hashtags != null) {
		for (var i = 0; i < cur_hashtags.length; i++) {
			if (new_hashtags.indexOf(cur_hashtags[i]) > -1) {
				continue;
			}
			new_hashtags.push(cur_hashtags[i]);
			var div = document.createElement("div");
			div.classList.add("hashtag");
			div.innerHTML = cur_hashtags[i];
			div.setAttribute("index", cur_index);
			div.setAttribute("hashtag", cur_hashtags[i]);
			div.addEventListener("click", function(event) {
				add_hashtag(event);
			});
			document.getElementById("hashtags_" + cur_index).appendChild(div);
		}
	}

	var alert_ids = new Array();

	if (state.search_alert_id == 0) {
		for (var i in state.topics.list) {
			if (! state.topics.list.hasOwnProperty(i)) {
				continue;
			}
			if (state.topics.list[i].adhoc == 1) {
				alert_ids.push(state.topics.list[i].alert_id);
				break;
			}
		}
	} else {
		alert_ids.push(state.search_alert_id);
	}

	for (alert_id in alert_ids) {
		cur_alert = alert_ids[alert_id];
		for (var i = 0; i < state.hashtags[cur_alert].length; i++) {
			console.log("Alert hashtag: " + state.hashtags[cur_alert][i]);
			if (new_hashtags.indexOf(state.hashtags[cur_alert][i]) > -1 || state.hashtags[cur_alert][i] == "") {
				continue;
			}
			new_hashtags.push(state.hashtags[cur_alert][i]);

			var div = document.createElement("div");
			div.classList.add("hashtag");
			div.innerHTML = state.hashtags[cur_alert][i];
			div.setAttribute("index", cur_index);
			div.setAttribute("hashtag", state.hashtags[cur_alert][i]);
			div.addEventListener("click", function(event) {
				add_hashtag(event);
			});
			document.getElementById("hashtags_" + cur_index).appendChild(div);
		}
	}

	document.getElementById("hashtags_" + cur_index).style.display="block";
}

function add_hashtag(e) {
	document.getElementById("edit_" + e.target.getAttribute("index")).value = document.getElementById("edit_" + e.target.getAttribute("index")).value + " " + e.target.getAttribute("hashtag");
	document.getElementById("edit_" + e.target.getAttribute("index")).focus();
	console.log("add_hashtag: " + e.target.getAttribute("index") + " - " + e.target.getAttribute("hashtag"));
}

function order_down (cur_index) {
	var next_object = -1;
	var cur_order = state.search_results[cur_index].order;
	for (var i = 0; i < state.search_results.length; i++) {
		if (i != cur_index && state.search_results[i].approved) {
			if (state.search_results[i].order < cur_order) {
				if (next_object == -1) {
					next_object = i;
				} else if (state.search_results[i].order > state.search_results[next_object].order) {
					next_object = i;
				}
			}
		}
	}

	if (next_object > -1) {
		state.search_results[cur_index].order = state.search_results[next_object].order;
		state.search_results[next_object].order = cur_order;
		swap_position(cur_index, next_object);
	}
}

function order_up (cur_index) {
	var prev_object = -1;
	var cur_order = state.search_results[cur_index].order;
	for (var i = 0; i < state.search_results.length; i++) {
		if (i != cur_index && state.search_results[i].approved) {
			if (state.search_results[i].order > cur_order) {
				if (prev_object == -1) {
					prev_object = i;
				} else if (state.search_results[i].order < state.search_results[prev_object].order) {
					prev_object = i;
				}
			}
		}
	}

	if (prev_object > -1) {
		state.search_results[cur_index].order = state.search_results[prev_object].order;
		state.search_results[prev_object].order = cur_order;
		swap_position(prev_object, cur_index);
	}
}

function swap_position(first, second) {
		document.getElementById("search_result_" + first).style.top = "87px";
		document.getElementById("search_result_" + second).style.top = "-87px";

		setTimeout("draw_search_results(cur_result_page)", 200);
}

function edit_object(i) {
	state.search_results[i].title = document.getElementById("edit_" + i).value;
	document.getElementById("count_" + i).innerHTML = document.getElementById("edit_" + i).value.length;
	if (document.getElementById("edit_" + i).value.length > 260) {
		document.getElementById("count_" + i).style.color = "red";
	} else {
		document.getElementById("count_" + i).style.color = "#141414";
	}

	show_hashtags(i);
}

function toggle_show_approved(force) {
	window.scrollTo(0, 0);
	var show_submit = false;
	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			show_submit = true;
			break;
		}
	}

	if (show_approved || force) {
		show_approved = false;
		document.getElementById("show_approved_button").innerHTML = "Continue";
		document.getElementById("show_approved_button_bottom").innerHTML = "Continue";
		document.getElementById("show_approved_button").style.backgroundColor = "rgb(238, 129, 56)";
		document.getElementById("show_approved_button_bottom").style.backgroundColor = "rgb(238, 129, 56)";

		document.getElementById("right_panel_saved_searches").style.display = "block";
		document.getElementById("edit_post_titles_label").style.display = "none";
		document.getElementById("show_approved_button").style.display = "none";
		document.getElementById("bulk_submit_button").style.display = "none";
		document.getElementById("show_approved_button_bottom").style.display = "none";
		document.getElementById("bulk_submit_button_bottom").style.display = "none";
		if (state.easy_search) {
			document.getElementById("right_panel_easy_search").style.display = "block";
			document.getElementById("right_panel_search_entry").style.display = "none";
		} else {
			document.getElementById("right_panel_easy_search").style.display = "none";
			document.getElementById("right_panel_search_entry").style.display = "flex";
		}
		document.getElementById("search_options_wrapper").style.display = "block";
		draw_search_results(-1);
	} else {
		show_approved = true;
		document.getElementById("right_panel_saved_searches").style.display = "none";
		document.getElementById("edit_post_titles_label").style.display = "block";
		document.getElementById("show_approved_button").innerHTML = "Back";
		document.getElementById("show_approved_button_bottom").innerHTML = "Back";
		document.getElementById("show_approved_button").style.backgroundColor = "";
		document.getElementById("show_approved_button_bottom").style.backgroundColor = "";

		document.getElementById("right_panel_easy_search").style.display = "none";
		document.getElementById("right_panel_search_entry").style.display = "none";
		document.getElementById("search_options_wrapper").style.display = "none";
		if (show_submit) {
			document.getElementById("show_approved_button").style.display = "none";
			document.getElementById("bulk_submit_button").style.display = "inline-block";
			document.getElementById("show_approved_button_bottom").style.display = "none";
			document.getElementById("bulk_submit_button_bottom").style.display = "inline-block";
		} else {
			document.getElementById("show_approved_button").style.display = "inline-block";
			document.getElementById("bulk_submit_button").style.display = "none";
			document.getElementById("show_approved_button_bottom").style.display = "inline-block";
			document.getElementById("bulk_submit_button_bottom").style.display = "none";
		}
		draw_search_results(-1);
	}
}

function toggle_approved(i) {
	if (state.search_results[i].approved) {
		state.search_results[i].approved = false;
		document.getElementById("approve_button_" + state.search_results[i].media_id).innerHTML = "Approve";
		document.getElementById("approve_button_" + state.search_results[i].media_id).classList.remove("topic_button_selected");
		document.getElementById("approve_button_" + state.search_results[i].media_id).classList.add("topic_button_unselected");
		document.getElementById("approve_button_" + state.search_results[i].media_id).classList.add("approve_button_unselected");
	} else {
		state.search_results[i].approved = true;
		document.getElementById("approve_button_" + state.search_results[i].media_id).innerHTML = "Approved";
		document.getElementById("approve_button_" + state.search_results[i].media_id).classList.remove("topic_button_unselected");
		document.getElementById("approve_button_" + state.search_results[i].media_id).classList.add("topic_button_selected");
		document.getElementById("approve_button_" + state.search_results[i].media_id).classList.remove("approve_button_unselected");
	}
	set_show_approved_button_state();
	save_state();
}

function set_show_approved_button_state() {
	var has_approved = false;
	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			has_approved = true;
			break;
		}
	}
	if (has_approved) {
		document.getElementById("show_approved_button").style.display = "inline-block";
		document.getElementById("show_approved_button_bottom").style.display = "inline-block";
	} else {
		document.getElementById("show_approved_button").style.display = "none";
		document.getElementById("show_approved_button_bottom").style.display = "none";
	}
}

function options_draw_excluded_domains() {
	update_options(false);

	if (typeof cur_options_excluded_domains === "undefined" || cur_options_excluded_domains == null) {
		cur_options_excluded_domains = state.options.excluded_domains;
	}
	if (typeof cur_options_excluded_domains === "undefined" || cur_options_excluded_domains == null) {
		cur_options_excluded_domains = "";
	}
	var draw_list = 'easy_search_domains';
	if (document.getElementById("options_domain_list") !== null) {
		draw_list = 'options_domain_list';
	}
	if (document.getElementById("easy_search_domains_autopilot") !== null) {
		draw_list = 'easy_search_domains_autopilot';
	}
	if (document.getElementById(draw_list) == null) {
		return;
	}

	cur_options_excluded_domains = state.options.excluded_domains;
	var excluded_domains = new Array();
	if (typeof cur_options_excluded_domains !== "undefined" && cur_options_excluded_domains !== null && cur_options_excluded_domains != "") {
		excluded_domains = cur_options_excluded_domains.split("|");
	}
	remove_all_children(document.getElementById(draw_list));
	excluded_domains.sort();
	var show_draw_list = false;
	for (var i = 0; i < excluded_domains.length; i++) {
		if (excluded_domains[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("topic_button_selected");
		div.setAttribute("domain", excluded_domains[i]);
		div.innerHTML = excluded_domains[i] + " ";

		div.addEventListener("click", function (event) {
			options_delete_exclude(event.target.getAttribute("domain"));
		});

		document.getElementById(draw_list).appendChild(div);
		show_draw_list = true;
	}
	if (show_draw_list) {
		document.getElementById(draw_list).style.display = "block";
	} else {
		document.getElementById(draw_list).style.display = "none";
	}
}

function options_add_exclude(domain) {
	var excluded_domains = new Array();
	if (typeof cur_options_excluded_domains !== "undefined" && cur_options_excluded_domains != null) {
		excluded_domains = cur_options_excluded_domains.split("|");
	}

	if (domain.trim() == "") {
		return;
	}

	var new_domains = domain.trim().split(" ");

	for (var i = 0; i < new_domains.length; i++) {
		var new_domain = trim_domain(new_domains[i], true);
		if (new_domain != "") {
			if (excluded_domains.indexOf(new_domain) > -1) {
				show_message("<div class='popup_message_title'>Duplicate Domain</div><div class='popup_message_body'>The domain '" + new_domain + "' is already in the list of excluded domains.</div>", true, 0, "block");
				return;
			}
		}
	}
	for (var i = 0; i < new_domains.length; i++) {
		var new_domain = trim_domain(new_domains[i], true);
		if (new_domain != "") {
			excluded_domains.push(new_domain);
		}
	}
	excluded_domains.sort();

	cur_options_excluded_domains = excluded_domains.join("|");
	if (document.getElementById("options_domain")) {
		document.getElementById("options_domain").value = "";
	} else if (document.getElementById("easy_search_options_domain_autopilot")) {
		document.getElementById("easy_search_options_domain_autopilot").value = "";
	} else {
		document.getElementById("easy_search_options_domain").value = "";
	}
	state.options.excluded_domains = cur_options_excluded_domains;
	save_state();
	save_options();
	options_draw_excluded_domains();
}

function options_delete_exclude(domain) {

	var excluded_domains = cur_options_excluded_domains.split("|");
	if (excluded_domains.indexOf(domain) == -1) {
		return;
	}

	excluded_domains.splice(excluded_domains.indexOf(domain), 1);
	cur_options_excluded_domains = excluded_domains.join("|");
	state.options.excluded_domains = cur_options_excluded_domains;
	save_state();
	save_options();
	options_draw_excluded_domains();
}

function options_draw_excluded_search_terms() {
	update_options(false);

	if (typeof cur_options_excluded_search_terms === "undefined" || cur_options_excluded_search_terms == null) {
		cur_options_excluded_search_terms = state.options.excluded_search_terms;
	}
	if (typeof cur_options_excluded_search_terms === "undefined" || cur_options_excluded_search_terms == null) {
		cur_options_excluded_search_terms = "";
	}
	var draw_list = 'options_exclude_search_terms_list';

	cur_options_excluded_search_terms = state.options.excluded_search_terms;
	var excluded_search_terms = new Array();
	if (typeof cur_options_excluded_search_terms !== "undefined" && cur_options_excluded_search_terms !== null && cur_options_excluded_search_terms != "") {
		excluded_search_terms = cur_options_excluded_search_terms.split("|");
	}
	remove_all_children(document.getElementById(draw_list));
	excluded_search_terms.sort();
	var show_draw_list = false;
	for (var i = 0; i < excluded_search_terms.length; i++) {
		if (excluded_search_terms[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("topic_button_selected");
		div.setAttribute("search_term", excluded_search_terms[i]);
		div.innerHTML = excluded_search_terms[i] + " ";

		div.addEventListener("click", function (event) {
			options_delete_search_terms(event.target.getAttribute("search_term"));
		});

		document.getElementById(draw_list).appendChild(div);
		show_draw_list = true;
	}
	if (show_draw_list) {
		document.getElementById(draw_list).style.display = "block";
	} else {
		document.getElementById(draw_list).style.display = "none";
	}
}

function options_add_exclude_search_term(search_terms) {
	search_terms  = search_terms.trim().toLowerCase();
	if (search_terms.indexOf("https://") > -1) {
		show_message("Error: exclude a search term only.", false, 0, "block");

		return;
	}
	var excluded_search_terms = new Array();
	if (typeof cur_options_excluded_search_terms !== "undefined" && cur_options_excluded_search_terms != null) {
		excluded_search_terms = cur_options_excluded_search_terms.split("|");
	}

	if (search_terms == "") {
		return;
	}
	if (excluded_search_terms.indexOf(search_terms) > -1) {
		return;
	}
	excluded_search_terms.push(search_terms);
	excluded_search_terms.sort();

	cur_options_excluded_search_terms = excluded_search_terms.join("|");
	document.getElementById("options_exclude_search_terms").value = "";

	state.options.excluded_search_terms = cur_options_excluded_search_terms;
	save_state();
	save_options();
	options_draw_excluded_search_terms();
}

function options_delete_search_terms(search_terms) {
	var excluded_search_terms = cur_options_excluded_search_terms.split("|");
	if (excluded_search_terms.indexOf(search_terms) == -1) {
		return;
	}

	excluded_search_terms.splice(excluded_search_terms.indexOf(search_terms), 1);
	cur_options_excluded_search_terms = excluded_search_terms.join("|");
	state.options.excluded_search_terms = cur_options_excluded_search_terms;
	save_state();
	save_options();
	options_draw_excluded_search_terms();
}

function options_draw_excluded_meta_tags() {
	update_options(false);
	if (typeof cur_options_excluded_meta_tags === "undefined" || cur_options_excluded_meta_tags == null) {
		cur_options_excluded_meta_tags = state.options.excluded_meta_tags;
	}
	if (typeof cur_options_excluded_meta_tags === "undefined" || cur_options_excluded_meta_tags == null) {
		cur_options_excluded_meta_tags = "";
	}
	var draw_list = 'options_exclude_meta_tags_list';

	cur_options_excluded_meta_tags = state.options.excluded_meta_tags;
	var excluded_meta_tags = new Array();
	if (typeof cur_options_excluded_meta_tags !== "undefined" && cur_options_excluded_meta_tags !== null && cur_options_excluded_meta_tags != "") {
		excluded_meta_tags = cur_options_excluded_meta_tags.split("|");
	}
	remove_all_children(document.getElementById(draw_list));
	excluded_meta_tags.sort();
	var show_draw_list = false;
	for (var i = 0; i < excluded_meta_tags.length; i++) {
		if (excluded_meta_tags[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("topic_button_selected");
		div.setAttribute("meta_tag", excluded_meta_tags[i]);
		div.innerHTML = excluded_meta_tags[i] + " ";

		div.addEventListener("click", function (event) {
			options_delete_meta_tags(event.target.getAttribute("meta_tag"));
		});

		document.getElementById(draw_list).appendChild(div);
		show_draw_list = true;
	}
	if (show_draw_list) {
		document.getElementById(draw_list).style.display = "block";
	} else {
		document.getElementById(draw_list).style.display = "none";
	}
}

function options_add_exclude_meta_tags(meta_tags) {
	meta_tags = meta_tags.trim().toLowerCase();
	var excluded_meta_tags = new Array();
	if (typeof cur_options_excluded_meta_tags !== "undefined" && cur_options_excluded_meta_tags != null) {
		excluded_meta_tags = cur_options_excluded_meta_tags.split("|");
	}
	if (meta_tags == "") {
		return;
	}
	if (excluded_meta_tags.indexOf(meta_tags) > -1) {
		return;
	}
	excluded_meta_tags.push(meta_tags);
	excluded_meta_tags.sort();

	cur_options_excluded_meta_tags = excluded_meta_tags.join("|");
	document.getElementById("options_exclude_meta_tags").value = "";

	state.options.excluded_meta_tags = cur_options_excluded_meta_tags;
	save_state();
	save_options();
	options_draw_excluded_meta_tags();
}

function options_delete_meta_tags(meta_tags) {
	var excluded_meta_tags = cur_options_excluded_meta_tags.split("|");
	if (excluded_meta_tags.indexOf(meta_tags) == -1) {
		return;
	}

	excluded_meta_tags.splice(excluded_meta_tags.indexOf(meta_tags), 1);
	cur_options_excluded_meta_tags = excluded_meta_tags.join("|");
	state.options.excluded_meta_tags = cur_options_excluded_meta_tags;
	save_state();
	save_options();
	options_draw_excluded_meta_tags();
}

function options_draw_excluded_youtube() {
	update_options(false);

	if (typeof cur_options_excluded_youtube === "undefined" || cur_options_excluded_youtube == null) {
		cur_options_excluded_youtube = state.options.excluded_youtube;
	}
	if (typeof cur_options_excluded_youtube === "undefined" || cur_options_excluded_youtube == null) {
		cur_options_excluded_youtube = "";
	}
	var draw_list = 'options_exclude_youtube_list';

	cur_options_excluded_youtube = state.options.excluded_youtube;
	var excluded_youtube = new Array();
	if (typeof cur_options_excluded_youtube !== "undefined" && cur_options_excluded_youtube !== null && cur_options_excluded_youtube != "") {
		excluded_youtube = cur_options_excluded_youtube.split("|");
	}
	remove_all_children(document.getElementById(draw_list));
	excluded_youtube.sort();
	var show_draw_list = false;
	for (var i = 0; i < excluded_youtube.length; i++) {
		if (excluded_youtube[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("topic_button_selected");
		div.setAttribute("channel", excluded_youtube[i]);
		div.innerHTML = excluded_youtube[i] + " ";

		div.addEventListener("click", function (event) {
			options_delete_youtube(event.target.getAttribute("channel"));
		});

		document.getElementById(draw_list).appendChild(div);
		show_draw_list = true;
	}
	if (show_draw_list) {
		document.getElementById(draw_list).style.display = "block";
	} else {
		document.getElementById(draw_list).style.display = "none";
	}
}

function options_add_exclude_youtube(youtube) {
	if (youtube.indexOf("https://") > -1) {
		if (youtube.trim().indexOf("https://www.youtube.com/") == 0) {

			var channel_id = get_youtube_channel_id(youtube);
			if (channel_id != "") {
				youtube = channel_id;
			} else {
				return;
			}
		} else {
			show_message("Error: Enter the channel's URL or ID only.", false, 0, "block");
			return;
		}
	}

	var excluded_youtube = new Array();
	if (typeof cur_options_excluded_youtube !== "undefined" && cur_options_excluded_youtube != null) {
		excluded_youtube = cur_options_excluded_youtube.split("|");
	}

	if (youtube == "") {
		return;
	}
	if (excluded_youtube.indexOf(youtube) > -1) {
		return;
	}
	excluded_youtube.push(youtube);

	excluded_youtube.sort();

	cur_options_excluded_youtube = excluded_youtube.join("|");
	document.getElementById("options_exclude_youtube").value = "";

	state.options.excluded_youtube = cur_options_excluded_youtube;
	save_state();
	save_options();
	options_draw_excluded_youtube();
}

function options_delete_youtube(youtube) {

	var excluded_youtube = cur_options_excluded_youtube.split("|");
	if (excluded_youtube.indexOf(youtube) == -1) {
		return;
	}

	excluded_youtube.splice(excluded_youtube.indexOf(youtube), 1);
	cur_options_excluded_youtube = excluded_youtube.join("|");
	state.options.excluded_youtube = cur_options_excluded_youtube;
	save_state();
	save_options();
	options_draw_excluded_youtube();
}

function show_trusted_domain_posts() {
	cur_options_trusted_domains = state.options.trusted_domains;
	var trusted_domains = new Array();
	if (cur_options_trusted_domains != null) {
		trusted_domains = cur_options_trusted_domains.split("|");
	}
	var cur_posts = document.getElementsByClassName("toggle_trusted_domain");
	var show_trusted_column = false;
	for (var i = 0; i < cur_posts.length; i++) {
		var cur_domain = cur_posts[i].getAttribute("domain");
		var cur_search_terms = cur_posts[i].getAttribute("search_terms");
		var show_trusted = false;
		cur_posts[i].value = "Untrusted";
		var toggle_inside = cur_posts[i].getElementsByTagName("div");
		toggle_inside[0].style.left = "18px";
		toggle_inside[0].style.backgroundColor = "#777";
		for (var d = 0; d < trusted_domains.length; d++) {
			if(trusted_domains[d].trim() == "") {
				continue;
			}
			if (trusted_domains[d].indexOf("youtube user") == 0 || trusted_domains[d].indexOf("youtube channel") == 0) {
				if (cur_search_terms == trusted_domains[d]) {
					toggle_inside[0].style.left = "0px";
					toggle_inside[0].style.backgroundColor = "#39b2ae";
					break;
				}
			} else if (cur_domain.indexOf(trusted_domains[d]) > -1) {
				console.log("trusted domain: " + cur_domain);
				toggle_inside[0].style.left = "0px";
				toggle_inside[0].style.backgroundColor = "#39b2ae";
				break;
			}
		}
		cur_posts[i].style.display = "block";
		show_trusted_column = true;
	}
	if (show_trusted_column) {
		var cur_cells = document.getElementsByClassName("trusted-column");
		for (var i = 0; i < cur_cells.length; i++) {
			cur_cells[i].style.display="table-cell";
		}
	}
}
var cur_trusted_source = "";
function toggle_trusted_domain(domain, search_terms) {
	var trusted_domains = new Array();
	if (cur_options_trusted_domains != null) {
		trusted_domains = cur_options_trusted_domains.split("|");
	}
	var trusted = -1;
	for (var i = 0; i < trusted_domains.length; i++) {
		if(trusted_domains[i].trim() == "") {
			continue;
		}
		if (domain.indexOf(trusted_domains[i]) > -1) {
			trusted = i;
			break;
		}
	}

	if (trusted == -1 && trusted_domains.indexOf(search_terms) == -1) {
		if (search_terms.indexOf("youtube user") == 0 || search_terms.indexOf("youtube channel") == 0) {
			show_confirm("Are you sure you want to set '" + search_terms + "' as trusted?", finish_add_trusted, "Yes", false, "No");
			cur_trusted_source = search_terms;
		} else {
			show_confirm("Are you sure you want to set the domain  '" + domain + "' as trusted?", finish_add_trusted, "Yes", false, "No");
			cur_trusted_source = domain;
		}
	} else {
		if (search_terms.indexOf("youtube user") == 0 || search_terms.indexOf("youtube channel") == 0) {
			cur_trusted_source = search_terms;
		} else {
			cur_trusted_source = domain;
		}
		options_delete_trusted(cur_trusted_source)
		cur_trusted_source = "";
		show_trusted_domain_posts();
		hide_message();
	}
}

function finish_add_trusted() {
	options_add_trusted(cur_trusted_source);
	cur_trusted_source = "";
	show_trusted_domain_posts();
	hide_message();
}

function options_draw_trusted_domains() {
	update_options(false);

	if (typeof cur_options_trusted_domains === "undefined" || cur_options_trusted_domains == null) {
		cur_options_trusted_domains = state.options.trusted_domains;
	}
	if (typeof cur_options_trusted_domains === "undefined" || cur_options_trusted_domains == null) {
		cur_options_trusted_domains = "";
	}
	var draw_list = 'easy_search_trusted_domains';
	if (document.getElementById("options_trusted_domain_list") !== null) {
		draw_list = 'options_trusted_domain_list';
	}
	if (document.getElementById("easy_search_trusted_domains_autopilot") !== null) {
		draw_list = 'easy_search_trusted_domains_autopilot';
	}
	if (document.getElementById(draw_list) == null) {
		return;
	}

	cur_options_trusted_domains = state.options.trusted_domains;
	var trusted_domains = new Array();
	if (typeof cur_options_trusted_domains !== "undefined" && cur_options_trusted_domains !== null && cur_options_trusted_domains != "") {
		trusted_domains = cur_options_trusted_domains.split("|");
	}
	remove_all_children(document.getElementById(draw_list));
	trusted_domains.sort();
	for (var i = 0; i < trusted_domains.length; i++) {
		if (trusted_domains[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("tag");
		div.classList.add("tag_small");
		div.classList.add("tag_grey");
		div.classList.add("topic_button_selected");
		div.setAttribute("domain", trusted_domains[i]);
		div.innerHTML = trusted_domains[i] + " ";

		div.addEventListener("click", function (event) {
			options_delete_trusted(event.target.getAttribute("domain"));
		});

		document.getElementById(draw_list).appendChild(div);
	}
}

function options_add_trusted(domain) {
	var trusted_domains = new Array();
	if (typeof cur_options_trusted_domains !== "undefined" && cur_options_trusted_domains !== null && cur_options_trusted_domains != "") {
		trusted_domains = cur_options_trusted_domains.split("|");
	}
	if (domain.trim() == "") {
		return;
	}

	var new_domains = new Array();
	if (domain.indexOf("youtube user") == 0 || domain.indexOf("youtube channel") == 0) {
		new_domains.push(domain.trim());
		console.log("add domain: " + new_domains[0]);
	} else {
		new_domains = domain.trim().split(" ");
	}

	for (var i = 0; i < new_domains.length; i++) {
		var new_domain = trim_domain(new_domains[i], false);
		if (new_domain != "") {
			if (trusted_domains.indexOf(new_domain) > -1) {
				show_message("<div class='popup_message_title'>Duplicate Domain</div><div class='popup_message_body'>The domain '" + new_domain + "' is already in the list of trusted domains.</div>", true, 0, "block");
				return;
			}
		}
	}
	for (var i = 0; i < new_domains.length; i++) {
		var new_domain;
		if (new_domains[i].indexOf("youtube user") == 0 || new_domains[i].indexOf("youtube channel") == 0) {
			new_domain = new_domains[i];
		} else {
			new_domain = trim_domain(new_domains[i], false);
		}
		console.log("new domain: " + new_domain);
		if (new_domain != "") {
			trusted_domains.push(new_domain);
		}
	}
	trusted_domains.sort();

	cur_options_trusted_domains = trusted_domains.join("|");
	if (document.getElementById("options_trusted_domain")) {
		document.getElementById("options_trusted_domain").value = "";
	} else if (document.getElementById("easy_search_options_trusted_domain_autopilot")) {
		document.getElementById("easy_search_options_trusted_domain_autopilot").value = "";
	} else if (document.getElementById("easy_search_options_trusted_domain")){
		document.getElementById("easy_search_options_trusted_domain").value = "";
	}
	state.options.trusted_domains = cur_options_trusted_domains;
	save_state();
	save_trusted_domains();
	options_draw_trusted_domains();
	show_trusted_domain_posts();
}

function options_delete_trusted(domain) {
	var trusted_domains = cur_options_trusted_domains.split("|");
	var trusted = -1;
	for (var i = 0; i < trusted_domains.length; i++) {
		if (domain.indexOf(trusted_domains[i]) > -1) {
			trusted = i;
			break;
		}
	}

	if (trusted == -1) {
		return;
	}

	trusted_domains.splice(trusted, 1);
	cur_options_trusted_domains = trusted_domains.join("|");
	state.options.trusted_domains = cur_options_trusted_domains;
	save_state();
	save_trusted_domains();
	options_draw_trusted_domains();
}
function save_trusted_domains() {
	var xmlhttp = new XMLHttpRequest();
	requeststring = "action=mondoplayer&form=trusted_domains&mondoplayer_trusted_domains=" + encodeURIComponent(state.options.trusted_domains);
	xmlhttp.open("POST", admin_post_url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	save_options();
}

function save_options() {
	if (document.getElementById("options_domain") != null) {
		options_add_exclude(document.getElementById("options_domain").value);
	} else if (document.getElementById("easy_search_options_domain_autopilot") != null){
		options_add_exclude(document.getElementById("easy_search_options_domain_autopilot").value);
	} else if (document.getElementById("easy_search_options_domain") != null) {
		options_add_exclude(document.getElementById("easy_search_options_domain").value);
	}
	if (document.getElementById("playOnlyDuringWifi") != null) {
		state.options.playOnlyDuringWifi = 0;
		if (document.getElementById("playOnlyDuringWifi").checked) {
			state.options.playOnlyDuringWifi = 1;
		}
		state.options.playDuringRoaming = 0;
		if (document.getElementById("playDuringRoaming").checked) {
			state.options.playDuringRoaming = 1;
		}
		state.options.onlyPostVideosWithThumbnails = 0;
		if (document.getElementById("onlyPostVideosWithThumbnails").checked) {
			state.options.onlyPostVideosWithThumbnails = 1;
		}
		state.options.mondoplayer_rss_message = document.getElementById("mondoplayer_rss_message").value;
		state.options.ignore_original_tags = 0;
		if (document.getElementById("ignore_original_tags").checked) {
			ignore_original_tags = 1;
			state.options.ignore_original_tags = 1;
		}
		state.options.emailFlag = 0;
		if (document.getElementById("emailFlag").checked) {
			state.options.emailFlag = 1;
		}
		state.options.notification = 0;
		if (document.getElementById("notification").checked) {
			state.options.notification = 1;
		}
	}
	if (document.getElementById("content_filter_profanity") != null) {
		var content_filters = "";
		if (document.getElementById("content_filter_gore").checked) {
			content_filters = content_filters + "1";
		} else {
			content_filters = content_filters + "0";
		}
		if (document.getElementById("content_filter_profanity").checked) {
			content_filters = content_filters + "1";
		} else {
			content_filters = content_filters + "0";
		}
		if (document.getElementById("content_filter_religion").checked) {
			content_filters = content_filters + "1";
		} else {
			content_filters = content_filters + "0";
		}
		if (document.getElementById("content_filter_sex").checked) {
			content_filters = content_filters + "1";
		} else {
			content_filters = content_filters + "0";
		}
		if (document.getElementById("content_filter_violence").checked) {
			content_filters = content_filters + "1";
		} else {
			content_filters = content_filters + "0";
		}
		state.options.content_filters = content_filters;
	}

	state.options.excluded_domains = cur_options_excluded_domains;
	save_state();

	show_busy("Saving...");
	var url = "https://www.mondoplayer.com/cgi-bin/account.cgi";

	var requeststring = "id=" + license_key + "&playOnlyDuringWifi=" + state.options.playOnlyDuringWifi + "&playDuringRoaming=" + state.options.playDuringRoaming + "&onlyPostVideosWithThumbnails=" + state.options.onlyPostVideosWithThumbnails + "&ignore_original_tags=" + state.options.ignore_original_tags + "&emailFlag=" + state.options.emailFlag + "&notification=" + state.options.notification + "&excluded_domains=" + encodeURIComponent(state.options.excluded_domains) + "&content_filters=" + encodeURIComponent(state.options.content_filters) + "&trusted_domains=" + encodeURIComponent(state.options.trusted_domains) + "&excluded_search_terms=" + encodeURIComponent(state.options.excluded_search_terms) + "&excluded_youtube=" + encodeURIComponent(state.options.excluded_youtube);
	console.log("requeststring: " + requeststring);
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	dirty = false;
	if (xmlhttp.responseText == "403") {
		console.log("save_options: 403");
		log_back_in();
		busy = false;
		return;
	}

	if (xmlhttp.responseText == "1") {
		document.getElementById("options_error").innerHTML = "There was an error saving your settings, please try again.";
		document.getElementById("options_error").style.display = "block";
		shake_error(document.getElementById("options_form"));
		busy = false;
		return;
	}

	if (document.getElementById("mondoplayer_prepend") !== null) {
		if (typeof tinyMCE !== "undefined") {
			tinyMCE.triggerSave();
		}
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
		requeststring = "action=mondoplayer&form=options&mondoplayer_prepend=" + encodeURIComponent(JSON.stringify(prepend_combined)) + "&mondoplayer_append=" + encodeURIComponent(JSON.stringify(append_combined)) + "&mondoplayer_rss_message=" + encodeURIComponent(state.options.mondoplayer_rss_message) + "&ignore_original_tags=" + state.options.ignore_original_tags + "&mondoplayer_max_words=" + document.getElementById('mondoplayer_max_words').value + "&mondoplayer_delete_age=" + document.getElementById('mondoplayer_delete_age').value + "&excluded_meta_tags=" + encodeURIComponent(state.options.excluded_meta_tags);
		xmlhttp.open("POST", admin_post_url, true);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.setRequestHeader("Accept", "text/plain");
		xmlhttp.send(requeststring);

		clear_shake_error(document.getElementById("options_form"));
		hide_busy();
		save_state();
		dirty = false;
		show_message("Options Saved", true, 2000, "none");
		//show_page("search_page");
	}
	hide_busy();
}

function open_change_email() {
	message = "<div id='email_change_title' class='option_popup_title'>Enter a New Email Address to use for this account</div><div class='options_popup_input'><input type='text' class='form_field_input' id='email_change_email' value='' placeholder='Email Address' autocorrect='off' autocapitalize='off' spellcheck='true' style='border: 2px solid #eee'><div id='email_change_email_error' class='form_field_error'></div></div><div class='options_popup_buttons'><input type='button' class='form_submit_btn_light' value='Change' onclick='change_email()' style='margin: 0 10px;width: 150px;display:inline-block' /><input type='button' class='form_submit_btn_light' value='Back' onclick='hide_message()' style='margin: 0 10px;width: 150px;display: inline-block' /></div>";
	show_message(message, false, 0, "none");
}

function change_email() {
	var email = document.getElementById("email_change_email").value;
	if(! email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) {
		document.getElementById("email_change_email_error").innerHTML = "Not a valid email address";
		document.getElementById("email_change_email_error").style.display = "block";
		return;
	}

	var url = "https://www.mondoplayer.com/cgi-bin/registration_update.cgi";

	var requeststring = "web=1&change_email=" + encodeURIComponent(email);

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("change_email: 403");
		log_back_in();
		return;
	}

	if (xmlhttp.responseText == "1") {
		document.getElementById("email_change_email_error").innerHTML = "There was an error saving your settings, please try again.";
		document.getElementById("email_change_email_error").style.display = "block"
		return;
	}

	try {
		var json = JSON.parse( xmlhttp.responseText);
		if (json.errorCode == 1) {
			document.getElementById("email_change_email_error").innerHTML = "That email address is unavailble.";
			document.getElementById("email_change_email_error").style.display = "block"
			return;
		} else {
			show_message("An email has been sent to <br />" + email + "<br />Please follow the instructions in the email.", true, 0, "block");
		}
	}
	catch(e) {

	}

	hide_message();
}

function open_submit_website() {
	var message = "<div id='submit_website_title' class='option_popup_title'>Help find videos you want</div><div class='options_popup_input'><input type='text' class='form_field_input' id='submit_website_website' value='' placeholder='Website Address' autocorrect='off' autocapitalize='off' spellcheck='true' style='border: 2px solid #eee'><div id='submit_website_error' class='form_field_error'></div></div><div class='options_popup_buttons'><input type='button' class='form_submit_btn_light' value='Submit' onclick='submit_website()'  style='margin: 0 10px;width: 150px;display: inline-block' /><input type='button' class='form_submit_btn_light' value='Back' onclick='hide_message()'  style='margin: 0 10px;width: 150px;display: inline-block' /></div>";
	show_message(message, false, 0, 'none');
	document.getElementById("submit_website_error").style.display = "none";
}

function submit_website() {
	var website = document.getElementById("submit_website_website").value;

	var url = "https://www.mondoplayer.com/cgi-bin/suggest_url.cgi";

	var requeststring = "url=" + encodeURIComponent(website);

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("change_email: 403");
		log_back_in();
		return;
	}

	if (xmlhttp.responseText == "1") {
		document.getElementById("submit_website_error").innerHTML = "There was an error saving your settings, please try again.";
		document.getElementById("submit_website_error").style.display = "block"
		return;
	}

	hide_message();
}

function clear_history() {
	var url = "https://www.mondoplayer.com/cgi-bin/account.cgi";

	var requeststring = "clearHistory=1";

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("clear_history: 403");
		log_back_in();
		return;
	}

	update_related_streams(true)

	show_message("Your search history has been cleared", true, 5000, "block");
}

function edit_topic(topic_id) {
	if (cur_page != "registration_page2") {
		if (dirty) {
			show_dirty(edit_topic, topic_id);
			return;
		}

		document.getElementById("topic_page").appendChild(document.getElementById("topic_form"));
		document.getElementById("topics_top").style.display = "none";
		document.getElementById("topics_save_button").value="Save";
		document.getElementById("topics_save_button").style.margin = "0 10px";
		document.getElementById("topics_close_button").style.display = "block";
	} else {
		document.getElementById("topics_close_button").style.display = "none";
	}

	var topic_count = 0;
	for (var i in state.topics.list) {
		if (! state.topics.list.hasOwnProperty(i)) {
			continue;
		}
		topic_count++;
	}

	update_keywords();
	//show_page("topic_page");

	dirty = true;

	document.getElementById("topic_title_error").style.display = "none";
	document.getElementById("selected_keywords_error").style.display = "none";

	if (topic_id == 0) {
		cur_topic.alert_id = 0;
		cur_topic.alert_title = "";
		cur_topic.schedules = new Array();
		cur_topic.schedules.push({"hour": 8, "timezone": timeZone, "offset": cur_date.getTimezoneOffset()});
		cur_topic.hashtags = new Array();
		cur_topic.search_terms = new Array();
		cur_topic.allow_notification = 0;
		cur_topic.allow_email = 0;
		document.getElementById("topics_delete_button").style.display = "none";
	} else {
		cur_topic.alert_id = state.topics.list[topic_id].alert_id;
		cur_topic.alert_title = state.topics.list[topic_id].alert_title;
		cur_topic.schedules = state.topics.list[topic_id].schedules.slice();
		cur_topic.hashtags = state.topics.list[topic_id].hashtags.slice();
		cur_topic.search_terms = state.topics.list[topic_id].search_terms.slice();
		cur_topic.allow_notification = state.topics.list[topic_id].allow_notification;
		cur_topic.allow_email = state.topics.list[topic_id].allow_email;
		document.getElementById("topics_delete_button").style.display = "block";
	}

	document.getElementById("topic_title").value = cur_topic.alert_title;

	if (cur_topic.allow_notification == 1) {
		document.getElementById("notifify_me_button").classList.remove("form_button_unselected");
		document.getElementById("notifify_me_button").classList.add("form_button_selected");
		document.getElementById("notifify_me_button").value="Notify Me \u25CF" ;
	} else {
		document.getElementById("notifify_me_button").classList.add("form_button_unselected");
		document.getElementById("notifify_me_button").classList.remove("form_button_selected");
		document.getElementById("notifify_me_button").value="Notify Me \u25CB" ;
	}
	if (cur_topic.allow_email == 1) {
		document.getElementById("email_me_button").classList.remove("form_button_unselected");
		document.getElementById("email_me_button").classList.add("form_button_selected");
		document.getElementById("email_me_button").value="Email Me \u25CF" ;
	} else {
		document.getElementById("email_me_button").classList.add("form_button_unselected");
		document.getElementById("email_me_button").classList.remove("form_button_selected");
		document.getElementById("email_me_button").value="Email Me \u25CB" ;
	}

	draw_search_terms();
	draw_schedules();
	document.getElementById("topics_content").style.display = "block";
	document.getElementById("topics_top").style.display = "block";
}

function get_autopilot_report() {
	if (cur_autopilot.autopilot_id == 0) {
		return;
	}
	if (cur_autopilot.autopilot_report_id == cur_autopilot.autopilot_id && cur_autopilot.autopilot_report.original != null) {
		show_autopilot_report();
		return;
	}
	if (cur_autopilot.search_terms_split.length == 0) {
		show_message("Search terms required. Enter search terms, schedule posts and rerun this report in a few hours.", true, 0, "block");
		return;
	}
	if (cur_autopilot.schedule.length == 0) {
		show_message("Post date and times are required. Schedule Posts and rerun this report in a few hours.", true, 0, "block");
		return;
	}
	cur_autopilot.autopilot_report_id = cur_autopilot.autopilot_id;
	var requeststring = "action=mondoplayer&form=get_autopilot_report&autopilot_id=" + cur_autopilot.autopilot_id;
	show_busy("Loading report...");
	dirty = false;

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			hide_busy();
			cur_autopilot.autopilot_report = JSON.parse(xmlhttp.responseText);
			save_state();
			clear_shake_error(document.getElementById("autopilot_form"));
			for (var i = 0; i < cur_autopilot.autopilot_report.original.length; i++) {
				var cur_original = cur_autopilot.autopilot_report.original[i];
				cur_original.post_url = "";
				cur_original.post_id = "";
				for (var t = 0; t < cur_autopilot.autopilot_report.posts.length; t++) {
					if (cur_original.url == cur_autopilot.autopilot_report.posts[t].original_url) {
						cur_original.post_url = cur_autopilot.autopilot_report.posts[t].url;
						cur_original.post_id = cur_autopilot.autopilot_report.posts[t].ID;
						cur_original.post_title = cur_autopilot.autopilot_report.posts[t].title;
						break;
					}
				}
			}
			show_autopilot_report();
		}
	};

	xmlhttp.open("POST", admin_post_url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);
}
function show_autopilot_report() {
	if (cur_autopilot.autopilot_report.original.length == 0) {
		show_message("No search results yet. Wait a few hours. If results do not appear after scheduled post time, add more search terms. For best results use simple search terms of one or two words.", true, 0, "block");
	}

	window.scrollTo(0,0);
	document.getElementById("autopilot_page_title").innerHTML = "AutoPilot History";
	document.getElementById("autopilot_form").style.display = "none";
	document.getElementById("autopilot_report_popup").style.display = "block";
	document.getElementById("autopilot_report_details_popup").style.display = "none";
	document.getElementById("autopilot_report_days_wrap").style.display = "block";
	var learning_date = new Date();
	learning_date.setHours(0,0,0);
	learning_date.setDate(learning_date.getDate() - 21);
	var report_date = new Date();
	report_date.setHours(0,0,0);
	report_date.setDate(report_date.getDate() - parseInt(document.getElementById("autopilot_report_days").value));
	var year_start = new Date(new Date().getFullYear(), 0, 1);
	var today = new Date();
	today.setHours(12,0,0);
	var end_view_day = Math.ceil((today - year_start)/(24*3600*1000));
	var start_view_day = end_view_day - document.getElementById("autopilot_report_days").value;

	var search_views = new Object();

	if (cur_autopilot.autopilot_report.views != null) {
		for (var i = 0; i < cur_autopilot.autopilot_report.views.length; i++) {
			if (cur_autopilot.autopilot_report.views[i].autopilot_id == cur_autopilot.autopilot_id && cur_autopilot.autopilot_report.views[i].day > start_view_day) {
				if (search_views[cur_autopilot.autopilot_report.views[i].search_terms] == null) {
					search_views[cur_autopilot.autopilot_report.views[i].search_terms] = parseInt(cur_autopilot.autopilot_report.views[i].total);
				} else {
					search_views[cur_autopilot.autopilot_report.views[i].search_terms] = search_views[cur_autopilot.autopilot_report.views[i].search_terms] + parseInt(cur_autopilot.autopilot_report.views[i].total);
				}
			}
		}
	}

	search_term_stats = new Object();
	for (var i = 0; i < cur_autopilot.search_terms_split.length; i++) {
		search_term_stats[cur_autopilot.search_terms_split[i]] = new Array();
	}

	for (var i = 0; i < cur_autopilot.autopilot_report.posts.length; i++) {
		cur_autopilot.autopilot_report.posts[i].send_date = new Date(cur_autopilot.autopilot_report.posts[i].date);
		cur_autopilot.autopilot_report.posts[i].send_date.setHours(0,0,0);
		if (cur_autopilot.autopilot_report.posts[i].send_date < report_date) {
			continue;
		}

		var found = false;
		for (var t = 0;t < cur_autopilot.search_terms_split.length; t++) {
			if (cur_autopilot.search_terms_split[t].indexOf(cur_autopilot.autopilot_report.posts[i].search_term) === 0 ) {
				search_term_stats[cur_autopilot.search_terms_split[t]].push(cur_autopilot.autopilot_report.posts[i]);
				found = true;
				break;
			}
		}
		if (! found) {
			cur_autopilot.autopilot_report.posts[i].send_date = new Date(cur_autopilot.autopilot_report.posts[i].add_date);
			cur_autopilot.autopilot_report.posts[i].send_date.setHours(0,0,0);
			search_term_stats[cur_autopilot.autopilot_report.posts[i].search_term] = new Array();
			search_term_stats[cur_autopilot.autopilot_report.posts[i].search_term].push(cur_autopilot.autopilot_report.posts[i]);
		}
	}

	document.getElementById("autopilot_report_detail_subhead").innerHTML = "<p style='color: black'>for AutoPilot '" + cur_autopilot.title + "'</p>";

	var views_title = "";
	if (cur_autopilot.autopilot_report.views != null) {
		views_title = "<th style='width: 160px;text-align: right'>Number of <br />Views</th>"
	}

	var report = "<table class='alternating' style='color: black;width: 100%;background-color: white'><thead style='background-color: #eee'><tr><th style='text-align: left'>Search Term</th><th style='width: 140px'>Status</th><th style='width: 160px;text-align: right'>Number of <br />Videos</th>" + views_title + "<th style='width:100px'></th></tr></thead><tbody>";
	var total_count = 0;
	var total_views = 0;
	var found_search_terms = new Object();
	for (var cur_search_term in search_term_stats) {
		if (! search_term_stats.hasOwnProperty(cur_search_term)) {
			continue;
		}
		var learning = "Active";
		var link = "";
		var search_term_display = cur_search_term;
		if (cur_autopilot.search_terms_split.indexOf(cur_search_term) > -1) {
			var i = cur_autopilot.search_terms_split.indexOf(cur_search_term);
			if (typeof cur_autopilot.search_terms_title_split[i] === "undefined" || cur_autopilot.search_terms_title_split[i] == "") {
			} else {
				var cur_search = cur_autopilot.search_terms_split[i].replace(/youtube \S* \S*/, "").trim();
				search_term_display = "'" + decodeURI(cur_autopilot.search_terms_title_split[i]) + "' on YouTube";
				if (cur_search != "") {
					search_term_display = search_term_display + " (" + cur_search + ")";
				}
			}
			if (search_term_display.length > 50) {
				search_term_display = search_term_display + "...";
			}

			var curdate = new Date(0);
			if (typeof cur_autopilot.search_terms_date_split[i] === "undefined" || cur_autopilot.search_terms_date_split[i] == "0000-00-00" || cur_autopilot.search_terms_date_split[i] == "") {
			} else if (cur_autopilot.search_terms_date_split[i] == -1 ) {
				learning = "Learning Mode <div class='learning_tooltip'>&#9432;<span class='tooltiptext'>Learning Mode in progress. This search term was recently added. It will take up to 3 weeks for the system to optimize results.</span></div>";
			} else if (cur_autopilot.search_terms_date_split[i].length >= 10) {
				var curdate = new Date(0);
				curdate.setYear(parseInt(cur_autopilot.search_terms_date_split[i].substring(0,4)));
				curdate.setMonth(parseInt(cur_autopilot.search_terms_date_split[i].substring(5,2)));
				curdate.setDate(parseInt(cur_autopilot.search_terms_date_split[i].substring(7,2)));
				if (cur_date > learning_date) {
					learning = "Learning Mode <div class='learning_tooltip'>&#9432;<span class='tooltiptext'>Learning Mode in progress. This search term was recently added. It will take up to 3 weeks for the system to optimize results.</span></div>";
				}
			}
		} else {
			learning = "Deleted";
		}

		search_term_display = search_term_display.replace(/'/g, '&apos;');
		var view_entry = ""
		if (cur_autopilot.autopilot_report.views != null) {
			view_count = 0;
			if (search_views[cur_search_term] != null) {
				view_count = search_views[cur_search_term];
				total_views = total_views + view_count;
				found_search_terms[cur_search_term] = view_count;
			}
			view_entry = "<td style='text-align: right'>" +  view_count.toLocaleString() + "</td>";
		}

		total_count = total_count + search_term_stats[cur_search_term].length;

		report = report + "<tr><td style='padding:0;'><input onClick='this.setSelectionRange(0, this.value.length)' type='text' value='" + search_term_display +"' readonly /></td><td style='text-align: center;font-size: 16px;color: #777'>" + learning + "</td><td style='text-align: right'>" +  search_term_stats[cur_search_term].length.toLocaleString() + "</td>" + view_entry + "<td><input type='button' value='Details' class='form_submit_btn_light' onclick='autopilot_report_details(\"" + cur_search_term.replace(/"/g, '\\"') + "\")' style='width:initial;height:initial;margin-left:20px;font-size: small' /></td></tr>";
	}

	if (cur_autopilot.autopilot_report.views != null) {
		for (var cur_search_term in search_views ) {
			if (search_views.hasOwnProperty(cur_search_term)) {
				if (typeof found_search_terms[cur_search_term] === "undefined" || found_search_terms[cur_search_term] == null) {
					search_term_display = cur_search_term.replace(/'/g, '&apos;');
					view_entry = "<td style='text-align: right'>" +  search_views[cur_search_term].toLocaleString() + "</td>";
					total_views = total_views + search_views[cur_search_term];

					report = report + "<tr><td style='padding:0;'><input onClick='this.setSelectionRange(0, this.value.length)' type='text' value='" + search_term_display +"' readonly /></td><td style='text-align: center;font-size: 16px;color: #777'> Deleted</td><td style='text-align: right'>0</td>" + view_entry + "<td></td></tr>";
				}
			}
		}
	}

	if (cur_autopilot.autopilot_report.views != null) {
		report = report + "<tr><td style='font-size: 18px'><b>Total:</b></td><td></td><td style='border-top: 1px solid #141414;text-align: right'>" + total_count + "</td><td style='border-top: 1px solid #141414;text-align: right'>" + total_views + "</td></tr>";
	}
	document.getElementById("autopilot_report").innerHTML = report + "</tbody></table>";
}

function close_autopilot_report_details() {
	window.scrollTo(0,0);
	document.getElementById("autopilot_page_title").innerHTML="AutoPilot Edit";
	document.getElementById("autopilot_report_popup").style.display="none";
	document.getElementById("autopilot_report_details_popup").style.display="none";
	document.getElementById("autopilot_report_days_wrap").style.display="none";
	document.getElementById("autopilot_form").style.display="block"
}

function autopilot_report_details(cur_search_term) {
	document.getElementById("autopilot_report_popup").style.display = "none";
	document.getElementById("autopilot_report_details_popup").style.display = "block";
	document.getElementById("autopilot_report_days_wrap").style.display = "block";
	document.getElementById("autopilot_page_title").innerHTML = "AutoPilot History for Search Term";
	document.getElementById("autopilot_report_detail_subhead").innerHTML = "<p style='color: black;font-size:large' >" + cur_search_term + "</p>";
	window.scrollTo(0,0);

	var options = {timeStyle:"short"};

	var search_views = new Object();

	var year_start = new Date(new Date().getFullYear(), 0, 1);
	var today = new Date();
	today.setHours(12,0,0);
	var end_view_day = Math.ceil((today - year_start)/(24*3600*1000));
	var start_view_day = end_view_day - document.getElementById("autopilot_report_days").value;

	var search_views = new Object();
	if (cur_autopilot.autopilot_report.views != null) {
		for (var i = 0; i < cur_autopilot.autopilot_report.views.length; i++) {
			if (cur_autopilot.autopilot_report.views[i].search_terms == cur_search_term && cur_autopilot.autopilot_report.views[i].autopilot_id == cur_autopilot.autopilot_id && cur_autopilot.autopilot_report.views[i].day > start_view_day) {
				if (search_views[cur_autopilot.autopilot_report.views[i].ID] == null) {
					search_views[cur_autopilot.autopilot_report.views[i].ID] = parseInt(cur_autopilot.autopilot_report.views[i].total);
				} else {
					search_views[cur_autopilot.autopilot_report.views[i].ID] = search_views[cur_autopilot.autopilot_report.views[i].ID] + parseInt(cur_autopilot.autopilot_report.views[i].total);
				}
			}
		}
	}

	var report = "<table class='alternating' style='color: black;width: 100%;background-color: white'><thead style='background-color: #eee'><tr><th style='text-align: left'>Date/Time of Post</th><th>Original Source</th><th style='text-align: right'>Views<br />(" + document.getElementById("autopilot_report_days").value + " Days)<th>Post</th></thead><tbody>";
	var found_search_views = new Object();
	var total_views = 0;
	if (typeof search_term_stats[cur_search_term] !== "undefined") {
		for (var i = search_term_stats[cur_search_term].length - 1; i >= 0; i--) {
			var cur_date = new Date(search_term_stats[cur_search_term][i].date);
			var view_entry = "";
			if (cur_autopilot.autopilot_report.views != null) {
				var view_count = "0";
				if (search_term_stats[cur_search_term][i].ID != "" && search_views[search_term_stats[cur_search_term][i].ID]) {
					view_count = search_views[search_term_stats[cur_search_term][i].ID];
					total_views = total_views + view_count;
					found_search_views[search_term_stats[cur_search_term][i].ID] = view_count;
				}
				view_entry = "<td style='text-align: right'>" + view_count.toLocaleString() + "</td>";
			}
			var post_link = "--";
			if (search_term_stats[cur_search_term][i].post_url != "") {
				var original_url = search_term_stats[cur_search_term][i].original_url[0];
				post_link = "<input type='button' onclick=\"window.open('" + original_url + "')\" value='View Post' />";
			}

			report = report + "<tr><td style='width: 170px'>" + months[cur_date.getMonth()] + " " + cur_date.getDate() + ", " + cur_date.toLocaleTimeString('en-US',options) + "</td><td><a href='" + search_term_stats[cur_search_term][i].url + "' target='_blank'>" + search_term_stats[cur_search_term][i].title.replace(/&amp;/g, "&") + "</a></td>" + view_entry + "<td>" + post_link + "</td></tr>";
		}
	}

	var extra_views = 0;
	if (cur_autopilot.autopilot_report.views != null) {
		for (var cur_id in search_views ) {
			if (search_views.hasOwnProperty(cur_id)) {
				if (found_search_views[cur_id] == null) {
					extra_views = extra_views + search_views[cur_id];
				}
			}
		}
	}

	if (extra_views > 0) {
		report = report + "<tr><td style='width: 170px' colspan='2'>Views for Videos Curated Before Last " + document.getElementById("autopilot_report_days").value + " Days</td><td style='text-align: right'>" + extra_views + "</td><td></td></tr>";
	}

	if (cur_autopilot.autopilot_report.views != null) {
		report = report + "<tr><td style='font-size: 18px'><b>Total:</b></td><td></td><td style='border-top: 1px solid #141414;text-align: right'>" + (total_views + extra_views) + "</td></tr>";
	}

	document.getElementById("autopilot_report_details").innerHTML = report + "</tbody></table>";
}

var cur_search_hashtags = new Object();
function draw_autopilot_search_hashtag_list() {
	document.getElementById("autopilot_search_hashtag_list").innerHTML = "";
	document.getElementById("autopilot_search_hashtags_selected").innerHTML = "";
	let hashtag_list = new Object();
	for (var i = 0; i < state.autopilots.list.length; i++) {
		if (state.autopilots.list[i].hashtags_string == null) {
			continue;
		}
		let cur_hashtags = {fixed:[],variable:[],search:[]};
		if (state.autopilots.list[i].hashtags_string != null && state.autopilots.list[i].hashtags_string != "") {
			cur_hashtags = JSON.parse(state.autopilots.list[i].hashtags_string);
		} else {
			state.autopilots.list[i].hashtags_string = JSON.stringify(cur_hashtags);
		}
		for (var t = 0; t < cur_hashtags.fixed.length; t++) {
			hashtag_list[cur_hashtags.fixed[t]] = 1;
		}
		for (var t = 0; t < cur_hashtags.variable.length; t++) {
			hashtag_list[cur_hashtags.variable[t]] = 1;
		}
		for (var s = 0; s < cur_hashtags.search.length; s++) {
			for (var t = 0; t < cur_hashtags.search[s].fixed.length; t++) {
				hashtag_list[cur_hashtags.search[s].fixed[t]] = 1;
			}
			for (var t = 0; t < cur_hashtags.search[s].variable.length; t++) {
				hashtag_list[cur_hashtags.search[s].variable[t]] = 1;
			}
		}
	}
	if (cur_autopilot.hashtags !== null) {
		for (var t = 0; t < cur_autopilot.hashtags.fixed.length; t++) {
			hashtag_list[cur_autopilot.hashtags.fixed[t]] = 1;
		}
		for (var t = 0; t < cur_autopilot.hashtags.variable.length; t++) {
			hashtag_list[cur_autopilot.hashtags.variable[t]] = 1;
		}
		for (var s = 0; s < cur_autopilot.hashtags.search.length; s++) {
			for (var t = 0; t < cur_autopilot.hashtags.search[s].fixed.length; t++) {
				hashtag_list[cur_autopilot.hashtags.search[s].fixed[t]] = 1;
			}
			for (var t = 0; t < cur_autopilot.hashtags.search[s].variable.length; t++) {
				hashtag_list[cur_autopilot.hashtags.search[s].variable[t]] = 1;
			}
		}
	}
	let hashtag_keys = Object.keys(hashtag_list);
	hashtag_keys.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
	for (var i = 0; i < hashtag_keys.length; i++) {
		var div = document.createElement("div");
		div.id = "search_hashtag_list_" + hashtag_keys[i];
		div.setAttribute("hashtag", hashtag_keys[i]);
		div.classList.add("tag","tag_small","tag_grey");
		var split_hashtag = hashtag_keys[i].split("|");
		if (split_hashtag.length == 1) {
			div.innerHTML = split_hashtag[0];
		} else {
			console.log("split_hashtag: " + hashtag_keys[i] + " - " + split_hashtag.length);
			div.innerHTML = split_hashtag[0] + " if " + parse_hashtag_filters(split_hashtag[1]);
		}
		div.addEventListener("click", function(e) {
			if (this.classList.contains("search_cur_hashtag_selected")) {
				return;
			}
			add_search_hashtag(this.getAttribute("hashtag"), 1);
		});
		document.getElementById("autopilot_search_hashtag_list").appendChild(div);
	}
	if (hashtag_keys.length == 0) {
		document.getElementById("autopilot_search_hashtag_list").innerHTML = "<div class='search_no_hashtags'>Add Hashtags to posts for this search to reach specific audiences.</div>";
	}
}

function parse_hashtag_filters(filter) {
	var split_filter = filter.split(" ");
	var filters = new Array();
	var is_quote = false;
	var quote = "";
	for (var i = 0; i < split_filter.length; i++) {
		if (is_quote) {
			if (split_filter[i].substring(split_filter[i].length -1) == '"') {
				filters.push(quote + " " + split_filter[i]);
				quote = "";
				is_quote = false;
				continue;
			} else {
				if (quote != "") {
					filters.push(quote)
					quote = quote + " ";
				}
				quote = quote + split_filter[i];
				continue;
			}
		}
		if (split_filter[i].substring(0,1) == '"') {
			if (quote != "") {
				filters.push(quote)
				quote = quote + " ";
			}
			is_quote = true;
			quote = quote + split_filter[i];
			continue;
		}
		filters.push(split_filter[i]);
	}

	return filters.join(" or ");
}

function add_search_hashtag(cur_hashtag, variable) {
	if (cur_hashtag.trim() == "" || cur_hashtag.trim() == "|") {
		return;
	}

	var hashtag_filter_split = cur_hashtag.split("|");
	var hashtag_filter = "";

	cur_hashtag = hashtag_filter_split[0].trim().replace(/\s+/g, ' ');
	if (hashtag_filter_split[1]) {
		hashtag_filter = hashtag_filter_split[1].trim().replace(/\s+/g, ' ');
	}

	var cur_hashtag_split = cur_hashtag.split(' ');
	for (var i = 0; i < cur_hashtag_split.length; i++) {
		if (cur_hashtag_split[i].substr(0,1) != "#" && cur_hashtag_split[i].substr(0,1) != "@") {
			cur_hashtag_split[i] = "#" + cur_hashtag_split[i];
		}
	}
	cur_hashtag = cur_hashtag_split.join(' ');
	if (hashtag_filter != "") {
		cur_hashtag = cur_hashtag + "|" + hashtag_filter;
	}
	var toggles = document.querySelectorAll("#autopilot_search_hashtags_selected .toggle_inside");
	for (var i = 0; i < toggles.length; i++) {
		if (toggles[i].getAttribute("hashtag") == cur_hashtag) {
			return;
		}
	}

	document.getElementById("autopilot_search_hashtag_input").value = "";
	document.getElementById("autopilot_search_hashtag_filter_input").value = "";
	cur_search_hashtags[cur_hashtag] = 0;
	if (document.getElementById("search_hashtag_list_" + cur_hashtag)) {
		document.getElementById("search_hashtag_list_" + cur_hashtag).classList.add("search_cur_hashtag_selected");
	} else {
		var div = document.createElement("div");
		div.id = "search_hashtag_list_" + cur_hashtag;
		div.setAttribute("hashtag", cur_hashtag);
		div.classList.add("tag","tag_small","tag_grey","search_cur_hashtag_selected");
		var split_hashtag = cur_hashtag.split("|");
		if (split_hashtag.length == 1) {
			div.innerHTML = split_hashtag[0] + "&nbsp;";
		} else {
			div.innerHTML = split_hashtag[0] + " if " + parse_hashtag_filters(split_hashtag[1]) + "&nbsp;";
		}

		div.addEventListener("click", function(e){
			if (this.classList.contains("search_cur_hashtag_selected")) {
				return;
			}
			add_search_hashtag(this.getAttribute("hashtag"), 1);
		});
		document.getElementById("autopilot_search_hashtag_list").appendChild(div);
	}
	var div = document.createElement("div");
	div.id = "search_hashtag_add_" + cur_hashtag.replaceAll("\\", "");
	div.setAttribute("hashtag", cur_hashtag);
	div.classList.add("search_cur_hashtag_entry");
	let toggle = "0";
	if (variable == 1) {
		toggle = "18px";
	}

	if (cur_hashtag.indexOf("|") == -1) {
		div.innerHTML = "<div class='search_cur_hashtag_text'>" + cur_hashtag + "</div><div class='search_cur_hashtag_toggle'><div class='toggle_outside' onclick='search_hashtag_toggle(\"" + cur_hashtag + "\")'><div class='toggle_inside' id='hashtag_toggle_"+ cur_hashtag + "' hashtag='" + cur_hashtag.replaceAll('"', '\"').replaceAll("'", '\'') + "' style='left: " + toggle + "'></div></div><input type='button' value='Delete' onclick='remove_search_hashtag(\"" + cur_hashtag.replaceAll('"', '**;').replaceAll("'", "*+") + "\")' /></div>";
	} else {
		var hashtag_split = cur_hashtag.split("|");

		div.innerHTML = "<div class='search_cur_hashtag_text'>" + hashtag_split[0] + " if " + parse_hashtag_filters(hashtag_split[1]).replaceAll('"', '&quot;') + "</div><div class='search_cur_hashtag_toggle'><div class='toggle_outside'><div class='toggle_inside' id='hashtag_toggle_"+ cur_hashtag.replaceAll('"', '\"').replaceAll("'", '\'')  + "' hashtag='" + cur_hashtag.replaceAll('"', '\"').replaceAll("'", '\'') + "' style='opacity: 0.5;left: 0'></div></div><input type='button' value='Delete' onclick='remove_search_hashtag(\"" + cur_hashtag.replaceAll('"', '**').replaceAll("'", "*+")  + "\")' /></div>";
	}
	document.getElementById("autopilot_search_hashtags_selected").appendChild(div);
	//search_hashtag_toggle(cur_hashtag);
	sort_search_hashtags();
	search_hashtag_set_variable_count();
}

function remove_search_hashtag(cur_hashtag) {
	console.log("cur_hashtag: " + cur_hashtag);
	cur_hashtag = cur_hashtag.replaceAll('**', '"').replaceAll("*+", "'");
	document.getElementById("autopilot_search_hashtags_selected").removeChild(document.getElementById("search_hashtag_add_" + cur_hashtag));
	document.getElementById("search_hashtag_list_" + cur_hashtag).classList.remove("search_cur_hashtag_selected");
}

function search_hashtag_set_variable_count() {
	var cur_variable_count = document.getElementById("autopilot_search_hashtag_variable_count").value;
	remove_all_children(document.getElementById("autopilot_search_hashtag_variable_count"));

	var variable_total = 0;
	var toggles = document.querySelectorAll("#autopilot_search_hashtags_selected .toggle_inside");
	for (var i = 0; i < toggles.length; i++) {
		if (toggles[i].style.left == "18px") {
			variable_total++;
		}
	}

	if (variable_total > 1) {
		document.getElementById("autopilot_search_hashtag_variable_count_display").style.display = "table-row";
	} else {
		document.getElementById("autopilot_search_hashtag_variable_count_display").style.display = "none";
	}

	for (var i = 1; i < variable_total; i++) {
		var opt = document.createElement("option");
		opt.text = i;
		opt.value = i;
		document.getElementById("autopilot_search_hashtag_variable_count").options.add(opt);
	}
	if (cur_variable_count > variable_total - 1) {
		cur_variable_count = variable_total - 1;
	}
	if (cur_variable_count < 1) {
		cur_variable_count = 1;
	}
	document.getElementById("autopilot_search_hashtag_variable_count").value = cur_variable_count;
}

function search_hashtag_toggle(hashtag) {
	if (document.getElementById("hashtag_toggle_"+ hashtag).style.left == "0px") {
		document.getElementById("hashtag_toggle_"+ hashtag).style.left = "18px";
	} else {
		document.getElementById("hashtag_toggle_"+ hashtag).style.left = "0px";
	}

	search_hashtag_set_variable_count();
	//edit_search_hashtags[id].variable = !edit_search_hashtags[id].variable;
	//setTimeout("autopilot_edit_hashtags_draw();", 250);
}

function edit_autopilot(autopilot_id) {
	document.getElementById("autopilot_page_title").innerHTML = "AutoPilot Edit";
	autopilot_edit_schedule(false);
	autopilot_edit_domains(false);
	update_autopilots(true);
	update_categories('autopilot');
	update_users('autopilot');
	document.getElementById("autopilot_categories").value = -1;
	//if (! state.isAccountSubscribed) {
	//	trial_expired();
	//	return;
	//}


	close_autopilot_hashtags(false);
	if (autopilot_id == 0) {
		var url = "https://www.mondoplayer.com/cgi-bin/autopilot.cgi";

		var requeststring = "id=" + license_key + "&check_autopilot=1&server_id=" + server_id;

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.setRequestHeader("Accept", "text/plain");
		xmlhttp.send(requeststring);


		if (xmlhttp.responseText == "403") {
			console.log("check_autopilot: 403");
			log_back_in();
			return;
		}

		try {
			var json = JSON.parse(xmlhttp.responseText);
			if (json.errorCode == 1) {
				var message = "<div class='slide_panel_text' style='font-size: xx-large;text-align: center'>" + json.page[0].title + "</div><div class='slide_rule'><hr style='width: 50%; border: 1px solid rgb(101, 205, 196);'></div><div style='text-align: center;padding-top: 20px'><input type='button' value='Click Here To Purchase More AutoPilots' onclick='show_page(\"account_select\");buy_autopilots();hide_message();' class='form_submit_btn_light' style='margin: 40px auto;font-size: 20px' /></div><p style='text-align: center;'><span onclick='hide_message()' style='color: blue;text-decoration: underline;cursor: pointer;font-size: 16px'>Cancel</span></p>";

				show_message(message, false, 0, "none");
				return;
			}
		}
		catch(e) {
			show_message("An error occured setting up the autopilot.  Please try again", true, 0, "block");
		}
	}

	//update_keywords();
	update_services(true);
	if (autopilot_id == 0) {
		cur_autopilot = new Object();
		cur_autopilot.autopilot_id = 0;
		cur_autopilot.autopilot_report_id = 0;
		cur_autopilot.title = "";
		cur_autopilot.search_terms = "";
		cur_autopilot.search_terms_date = "";
		cur_autopilot.search_terms_title = "";
		cur_autopilot.search_term_index = 0;
		cur_autopilot.search_terms_split = new Array();
		cur_autopilot.search_terms_title_split = new Array();
		cur_autopilot.search_terms_date_split = new Array();
		cur_autopilot.email = "";
		cur_autopilot.campaign = "";
		cur_autopilot.feed = "";
		cur_autopilot.feed_video_only = 1;
		cur_autopilot.service = 15;
		//cur_autopilot.schedule = [{"hour":"8","day":"0"},{"hour":"10","day":"0"},{"hour":"12","day":"0"},{"hour":"8","day":"1"},{"hour":"10","day":"1"},{"hour":"12","day":"1"},{"hour":"14","day":"1"},{"hour":"16","day":"1"},{"hour":"8","day":"2"},{"hour":"10","day":"2"},{"hour":"12","day":"2"},{"hour":"14","day":"2"},{"hour":"16","day":"2"},{"hour":"8","day":"3"},{"hour":"10","day":"3"},{"hour":"12","day":"3"},{"hour":"14","day":"3"},{"hour":"16","day":"3"},{"hour":"8","day":"4"},{"hour":"10","day":"4"},{"hour":"12","day":"4"},{"hour":"14","day":"4"},{"hour":"16","day":"4"},{"hour":"8","day":"5"},{"hour":"10","day":"5"},{"hour":"12","day":"5"},{"hour":"14","day":"5"},{"hour":"16","day":"5"},{"hour":"8","day":"6"},{"hour":"10","day":"6"},{"hour":"12","day":"6"}];
		cur_autopilot.day_counts = "0,0,0,0,0,0,0";
		cur_autopilot.email_0 = 0;
		cur_autopilot.email_1 = 0;
		cur_autopilot.email_2 = 0;
		cur_autopilot.email_3 = 0;
		cur_autopilot.email_4 = 0;
		cur_autopilot.email_5 = 0;
		cur_autopilot.email_6 = 0;
		cur_autopilot.spredfast_company = 0;
		cur_autopilot.spredfast_account = 0;
		cur_autopilot.spredfast_initiative = 0;
		cur_autopilot.spredfast_service = 0;
		cur_autopilot.spredfast_service_split = new Array();
		cur_autopilot.buffer_company = 0;
		cur_autopilot.buffer_initiative = 0;
		cur_autopilot.buffer_profiles = "";
		cur_autopilot.buffer_profiles_split = new Array();
		cur_autopilot.excluded_domains = "";
		cur_autopilot.hashtags_string = "";
		cur_autopilot.hashtags = {"active":1,"fixed":new Array(),"variable":new Array(),"search": new Array(cur_autopilot.search_terms_split.length)};
		cur_autopilot.categories = "[]";
		cur_autopilot.user = curator_user;
		cur_autopilot.schedule = new Array();
		for (var d = 0; d < 7; d++) {
			for (var h = 0; h < 24; h++) {
				cur_autopilot.schedule.push({"hour": h.toString(), "day": d.toString()});
			}
		}
		document.getElementById("autopilot_delete_button").style.display = "none";
	} else {
		set_cur_autopilot(autopilot_id);
		document.getElementById("autopilot_delete_button").style.display = "inline-block";
	}

	categories_split = JSON.parse(cur_autopilot.categories);

	autopilot_draw_categories();
	document.getElementById("autopilot_users").value = cur_autopilot.user;

	if (cur_autopilot.feed_video_only == 1) {
		document.getElementById("autopilot_feed_video_only").checked = true;
	} else {
		document.getElementById("autopilot_feed_video_only").checked = false;
	}
	autopilot_draw_search_terms();
	autopilot_draw_schedules();
	document.getElementById("autopilot_title").value = cur_autopilot.title;
	if (document.getElementById("autopilot_service").options.length == 0) {
		var blank_opt = document.createElement("option");
		blank_opt.text = "Select a Service...";
		blank_opt.value = -1;
		document.getElementById("autopilot_service").options.add(blank_opt);
		for (var i = 0; i < state.services.list.services.length; i++) {
			var opt = document.createElement("option");
			opt.text = state.services.list.services[i].service_name;
			opt.value = state.services.list.services[i].service_id; 
			document.getElementById("autopilot_service").options.add(opt);
		}
	}
	//document.getElementById("autopilot_keyword_entry").value = "";
	document.getElementById("autopilot_schedule_day").value = "--";
	document.getElementById("autopilot_schedule_hour").value = "--";
	document.getElementById("autopilot_hashtags").value = "";
	document.getElementById("autopilot_hashtags_filters").value = "";
	document.getElementById("autopilot_email_schedule_email").value = cur_autopilot.email;

	autopilot_draw_hashtags();

	document.getElementById("autopilot_service").value = cur_autopilot.service;
	set_service_select(document.getElementById("autopilot_service_select"));

	autopilot_show_feed();
	autopilot_show_campaign();
	document.getElementById("autopilot_campaign_title").value = cur_autopilot.campaign;

	document.getElementById("autopilot_email_schedule_day_0").checked = cur_autopilot.email_0 == 1;
	document.getElementById("autopilot_email_schedule_day_1").checked = cur_autopilot.email_1 == 1;
	document.getElementById("autopilot_email_schedule_day_2").checked = cur_autopilot.email_2 == 1;
	document.getElementById("autopilot_email_schedule_day_3").checked = cur_autopilot.email_3 == 1;
	document.getElementById("autopilot_email_schedule_day_4").checked = cur_autopilot.email_4 == 1;
	document.getElementById("autopilot_email_schedule_day_5").checked = cur_autopilot.email_5 == 1;
	document.getElementById("autopilot_email_schedule_day_6").checked = cur_autopilot.email_6 == 1;

	autopilot_select_service();
	//autopilot_draw_excluded_domains();
	options_draw_excluded_domains();
	show_add_autopilot(true);
}

function set_cur_autopilot(autopilot_id) {
	if (autopilot_id == 0) {
		return;
	}
	var index = -1;
	for (var i = 0; i < state.autopilots.list.length; i++) {
		if (state.autopilots.list[i].autopilot_id == autopilot_id) {
			index = i;
			break;
		}
	}
	cur_autopilot.autopilot_id = state.autopilots.list[index].autopilot_id;
	cur_autopilot.title = state.autopilots.list[index].title;
	cur_autopilot.search_terms = state.autopilots.list[index].search_terms;
	cur_autopilot.search_terms_date = state.autopilots.list[index].search_terms_date;
	cur_autopilot.search_terms_title = state.autopilots.list[index].search_terms_title;
	cur_autopilot.search_term_index = state.autopilots.list[index].search_term_index;
	cur_autopilot.search_terms_split = state.autopilots.list[index].search_terms.split("|");
	for (var i = 0; i < cur_autopilot.search_terms_split.length; i++) {
		cur_autopilot.search_terms_split[i] = cur_autopilot.search_terms_split[i].trim();
	}
	if (state.autopilots.list[index].search_terms_date == null) {
		cur_autopilot.search_terms_date_split = new Array(cur_autopilot.search_terms_split.length);
	} else {
		cur_autopilot.search_terms_date_split = state.autopilots.list[index].search_terms_date.split("|");
		if (cur_autopilot.search_terms_date_split.length < cur_autopilot.search_terms_split.length) {
			cur_autopilot.search_terms_date_split = new Array(cur_autopilot.search_terms_split.length);
		}
	}
	if (state.autopilots.list[index].search_terms_title == null) {
		cur_autopilot.search_terms_title_split = new Array(cur_autopilot.search_terms_split.length);
	} else {
		cur_autopilot.search_terms_title_split = state.autopilots.list[index].search_terms_title.split("|");
		if (cur_autopilot.search_terms_title_split.length < cur_autopilot.search_terms_split.length) {
			cur_autopilot.search_terms_title_split = new Array(cur_autopilot.search_terms_split.length);
		}
	}
	cur_autopilot.email = state.autopilots.list[index].email;
	cur_autopilot.campaign = state.autopilots.list[index].campaign;
	cur_autopilot.feed = state.autopilots.list[index].feed;
	cur_autopilot.feed_video_only = state.autopilots.list[index].feed_video_only;
	cur_autopilot.service = state.autopilots.list[index].service;
	cur_autopilot.schedule = state.autopilots.list[index].schedule;
	cur_autopilot.day_counts = state.autopilots.list[index].day_counts;
	cur_autopilot.email_0 = state.autopilots.list[index].email_0;
	cur_autopilot.email_1 = state.autopilots.list[index].email_1;
	cur_autopilot.email_2 = state.autopilots.list[index].email_2;
	cur_autopilot.email_3 = state.autopilots.list[index].email_3;
	cur_autopilot.email_4 = state.autopilots.list[index].email_4;
	cur_autopilot.email_5 = state.autopilots.list[index].email_5;
	cur_autopilot.email_6 = state.autopilots.list[index].email_6;
	cur_autopilot.spredfast_company = state.autopilots.list[index].spredfast_company;
	cur_autopilot.spredfast_account = state.autopilots.list[index].spredfast_account;
	cur_autopilot.spredfast_initiative = state.autopilots.list[index].spredfast_initiative;
	cur_autopilot.spredfast_service = state.autopilots.list[index].spredfast_service;
	cur_autopilot.buffer_company = state.autopilots.list[index].buffer_company;
	cur_autopilot.buffer_initiative = state.autopilots.list[index].buffer_initiative;
	cur_autopilot.buffer_profiles = state.autopilots.list[index].buffer_profiles;
	cur_autopilot.excluded_domains = state.autopilots.list[index].excluded_domains;
	cur_autopilot.hashtags_string = state.autopilots.list[index].hashtags_string;
	if (state.autopilots.list[index].categories == null || state.autopilots.list[index].categories == "") {
		cur_autopilot.categories = "[]";
	} else {
		cur_autopilot.categories = state.autopilots.list[index].categories;
	}
	cur_autopilot.user = state.autopilots.list[index].user;
	if (cur_autopilot.hashtags_string == null || cur_autopilot.hashtags_string == "") {
		cur_autopilot.hashtags = {"active":0,"fixed":new Array(),"variable":new Array(),"search": new Array(cur_autopilot.search_terms_split.length)};
	} else {
		cur_autopilot.hashtags = JSON.parse(state.autopilots.list[index].hashtags_string);
	}
}

function show_add_autopilot(show) {
	window.scrollTo(0,0);

	if (show) {
		document.getElementById("autopilot_page_title").innerHTML = "AutoPilot Edit";
		document.getElementById("show_add_autopilot").style.display = "none";
		document.getElementById("mondoplayer_autopilot_table").style.display = "none";
		document.getElementById("new_autopilot_wrapper").style.display = "block";
	} else {
		document.getElementById("autopilot_page_title").innerHTML = "AutoPilots";
		document.getElementById("show_add_autopilot").style.display = "block";
		document.getElementById("mondoplayer_autopilot_table").style.display = "table";
		document.getElementById("new_autopilot_wrapper").style.display = "none";
		cur_autopilot = new Object();
		cur_autopilot.autopilot_id = 0;
	}
}
function autopilot_show_search(is_edit) {
	autopilot_edit_search_term_original = "";
	autopilot_edit_search_term_original_index = -1;
	draw_autopilot_search_hashtag_list();
	document.getElementById("autopilot_search_popup").style.display = "flex";
	document.getElementById("autopilot_form_bottom").style.display = "none";
	document.getElementById("autopilot_form_top").style.display = "none";
	document.getElementById("autopilot_search_hashtag_variable_count_display").style.display = "none";
	open_easy_search("");
	if (is_edit) {
		document.getElementById("advanced_search_delete_button_autopilot").style.display = "inline-block";
		document.getElementById("easy_search_delete_button_autopilot").style.display = "inline-block";
	} else {
		parse_advanced_search("");
		document.getElementById("advanced_search_delete_button_autopilot").style.display = "none";
		document.getElementById("easy_search_delete_button_autopilot").style.display = "none";
	}

}

function autopilot_hide_search() {
	document.getElementById("autopilot_search_popup").style.display = "none";
	document.getElementById("autopilot_form_bottom").style.display = "block";
	document.getElementById("autopilot_form_top").style.display = "table";
}

function toggle_hashtags() {
	//if (cur_autopilot.hashtags.active == 0) {
		document.getElementById("autopilot_hashtag_details").style.display = "table";
		document.getElementById("autopilot_hashtags_table").style.display = "table";
	//	cur_autopilot.hashtags.active = 1;
	//} else {
	//	document.getElementById("autopilot_hashtag_details").style.display = "none";
	//	document.getElementById("autopilot_hashtags_table").style.display = "none";
	//	cur_autopilot.hashtags.active = 0;
	//}
	cur_autopilot.hashtags_string = JSON.stringify(cur_autopilot.hashtags);
	autopilot_draw_hashtags();
}

function autopilot_draw_hashtags() {
	cur_autopilot.hashtags.active = 1;
	document.getElementById("add_hashtag_toggle").style.left = "0px";
	document.getElementById("add_hashtag_toggle").style.backgroundColor = "#39b2ae";

	document.getElementById("autopilot_hashtag_details").style.display = "table";
	document.getElementById("autopilot_hashtags_table").style.display = "table";
	//document.getElementById("autopilot_hashtags").value = "";

	while (document.getElementById("autopilot_hashtags_search_term").firstChild ) {
		document.getElementById("autopilot_hashtags_search_term").removeChild(document.getElementById("autopilot_hashtags_search_term").firstChild);
	}

	var has_hashtags = false;
	var div = document.createElement("div");
	div.id = "hashtag_search_term_-1";
	div.setAttribute('picked', false);
	div.setAttribute('index', -1);
	div.innerHTML = "All Posts";
	div.classList.add("hashtag_search_term");
	div.addEventListener("click", toggle_hashtag_list_select);
	document.getElementById("autopilot_hashtags_search_term").appendChild(div);

	div = document.createElement("div");
	div.classList.add("hashtag_search_term_blank");
	div.setAttribute('picked', false);
	div.setAttribute('index', -1);
	div.innerHTML = "or select searches";
	document.getElementById("autopilot_hashtags_search_term").appendChild(div);

	for (var s = 0; s < search_terms_labels.length; s++) {
		i = search_terms_labels[s].index;
		if (cur_autopilot.search_terms_split[i].trim() == "") {
			continue;
		}
		div = document.createElement("div");
		div.id = "hashtag_search_term_" + i;
		div.classList.add("hashtag_search_term");
		div.setAttribute('picked', false);
		div.setAttribute('index', i);
		div.addEventListener("click", toggle_hashtag_list_select);

		if (search_terms_labels[s].youtube) {
			div.innerHTML = search_terms_labels[s].title;
		} else {
			div.innerHTML = search_terms_labels[s].title;
		}
		document.getElementById("autopilot_hashtags_search_term").appendChild(div);
	}

	remove_all_children(document.getElementById("autopilot_hashtags_list"));

	if (cur_autopilot.hashtags.fixed == null) {
		cur_autopilot.hashtags.fixed = new Array();
	}
	if (cur_autopilot.hashtags.variable == null) {
		cur_autopilot.hashtags.variable = new Array();
	}
	if (cur_autopilot.hashtags.variable_count == null) {
		cur_autopilot.hashtags.variable_count = 1;
	}
	if (cur_autopilot.hashtags.fixed.length > 0 || cur_autopilot.hashtags.variable.length > 0) {
		var div = document.createElement("div");
		div.style.marginTop = "12px";
		var label = document.createElement("div");
		label.style.display = "inline-block";
		label.innerHTML = "<b>All Posts<b> ";

		var edit_button = document.createElement("div");
		edit_button.classList.add("form_submit_btn");
		edit_button.style.width = "initial";
		edit_button.style.display = "inline-block";
		edit_button.style.textTransform = "none";
		edit_button.style.marginLeft = "12px";
		edit_button.style.height = "auto";
		edit_button.innerHTML = "Edit";
		edit_button.setAttribute("search", -1);
		edit_button.addEventListener("click", function(event) {
			edit_hashtags_list = [parseInt(event.target.getAttribute("search"))];
			autopilot_edit_hashtags_next();
		});
		div.appendChild(label);
		div.appendChild(edit_button);
		document.getElementById("autopilot_hashtags_list").appendChild(div);
	}
	if (cur_autopilot.hashtags.fixed.length > 0) {
		var div = document.createElement("div");
		var label = document.createElement("div");
		label.style.display = "block";
		label.innerHTML = "Include in every post:";
		div.appendChild(label);
		var fixed_hashtags = cur_autopilot.hashtags.fixed;
		for (var i = 0; i < fixed_hashtags.length; i++) {
			if (fixed_hashtags[i] == "") {
				continue;
			}

			autopilot_draw_hashtag_tag(fixed_hashtags[i], div);
		}
		document.getElementById("autopilot_hashtags_list").appendChild(div);
		has_hashtags = true;
	}
	if (cur_autopilot.hashtags.variable.length > 0) {
		var div = document.createElement("div");
		var label = document.createElement("div");
		label.style.display = "block";
		label.innerHTML = "Include " + cur_autopilot.hashtags.variable_count + " in every post:";
		div.appendChild(label);
		var variable_hashtags = cur_autopilot.hashtags.variable;
		variable_hashtags.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
		for (var i = 0; i < variable_hashtags.length; i++) {
			if (variable_hashtags[i] == "") {
				continue;
			}

			autopilot_draw_hashtag_tag(variable_hashtags[i], div);
		}
		document.getElementById("autopilot_hashtags_list").appendChild(div);
		has_hashtags = true;
	}

	for (var s = 0; s < search_terms_labels.length; s++) {
		var search = search_terms_labels[s].index;
		var cur_search = cur_autopilot.hashtags.search[search];
		if (typeof cur_search === "undefined" || cur_search == null) {
			cur_search = {"fixed":new Array(), "variable":new Array(), "variable_count":1};
		}
		if (cur_search.fixed == null) {
			cur_search.fixed = new Array();
		}
		if (cur_search.variable == null) {
			cur_search.variable = new Array();
		}
		if (cur_search.variable_count == null) {
			cur_search.variable_count = 1;
		}
		cur_autopilot.hashtags.search[search] = cur_search;
		if (cur_search.fixed.length == 0 && cur_search.variable.length == 0) {
			continue;
		}

		var div = document.createElement("div");
		div.style.marginTop = "12px";
		var label = document.createElement("div");
		label.style.display = "inline-block";
		label.innerHTML = "<b>Posts From Search '" + search_terms_labels[s].title + "'<b> ";

		var edit_button = document.createElement("div");
		edit_button.classList.add("form_submit_btn");
		edit_button.style.width = "initial";
		edit_button.style.height = "auto";
		edit_button.style.display = "inline-block";
		edit_button.style.textTransform = "none";
		edit_button.style.marginLeft = "12px";
		edit_button.innerHTML = "Edit";
		edit_button.setAttribute("search", search);
		edit_button.addEventListener("click", function(event) {
			edit_hashtags_list = [parseInt(event.target.getAttribute("search"))];
			autopilot_edit_hashtags_next();
		});
		div.appendChild(label);
		div.appendChild(edit_button);
		document.getElementById("autopilot_hashtags_list").appendChild(div);

		if (cur_search.fixed.length > 0) {
			var div = document.createElement("div");
			var label = document.createElement("div");
			label.style.display = "block";
			label.innerHTML = "Include in every post:";
			div.appendChild(label);
			var fixed_hashtags = cur_search.fixed;
			for (var i = 0; i < fixed_hashtags.length; i++) {
				if (fixed_hashtags[i] == "") {
					continue;
				}
				autopilot_draw_hashtag_tag(fixed_hashtags[i], div);
			}
			document.getElementById("autopilot_hashtags_list").appendChild(div);
			has_hashtags = true;
		}
		if (cur_search.variable.length > 0) {
			var div = document.createElement("div");
			var label = document.createElement("div");

			label.style.display = "block";
			label.innerHTML = "Include " + cur_search.variable_count + " in every '" + search_terms_labels[s].title + "' post:";
			div.appendChild(label);
			var variable_hashtags = cur_search.variable;
			variable_hashtags.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
			for (var i = 0; i < variable_hashtags.length; i++) {
				if (variable_hashtags[i] == "") {
					continue;
				}
				autopilot_draw_hashtag_tag(variable_hashtags[i], div);
			}
			document.getElementById("autopilot_hashtags_list").appendChild(div);
			has_hashtags = true;
		}
	}
	if (has_hashtags && typeof is_turnkey !== "undefined" && is_turnkey) {
		document.getElementById("autopilot_hashtag_droplet_feed").style.display = "table";
	} else {
		document.getElementById("autopilot_hashtag_droplet_feed").style.display = "none";
	}
	if (cur_autopilot.service == 10) {
		document.getElementById("autopilot_hashtag_feed").style.display = "table";
	} else {
		document.getElementById("autopilot_hashtag_feed").style.display = "none";
	}

	cur_autopilot.hashtags_string = JSON.stringify(cur_autopilot.hashtags);
}

function toggle_hashtag_list_select(event) {
	var selection = parseInt(event.target.getAttribute("index"));
	if (selection == -1) {
		edit_hashtags_list = new Array();
		if (document.getElementById("hashtag_search_term_-1").getAttribute('picked') == "true") {
			document.getElementById("hashtag_search_term_-1").setAttribute('picked', false);
			document.getElementById("hashtag_search_term_-1").classList.remove('selected_hashtag_search');
		} else {
			document.getElementById("hashtag_search_term_-1").setAttribute('picked', true);
			document.getElementById("hashtag_search_term_-1").classList.add('selected_hashtag_search');
			edit_hashtags_list.push(-1);
		}
		for (var s = 0; s < search_terms_labels.length; s++) {
			i = search_terms_labels[s].index;
			if (cur_autopilot.search_terms_split[i].trim() == "") {
				continue;
			}
			document.getElementById("hashtag_search_term_" + i).setAttribute('picked', false);
			document.getElementById("hashtag_search_term_" + i).classList.remove('selected_hashtag_search');
		}
	} else {
		if (edit_hashtags_list.indexOf(-1) > -1) {
			edit_hashtags_list.splice(edit_hashtags_list.indexOf(-1), 1);
		}
		document.getElementById("hashtag_search_term_-1").setAttribute('picked', false);
		document.getElementById("hashtag_search_term_-1").classList.remove('selected_hashtag_search');
		if (document.getElementById("hashtag_search_term_" + selection).getAttribute('picked') == "true") {
			document.getElementById("hashtag_search_term_" + selection).setAttribute('picked', false)
			document.getElementById("hashtag_search_term_" + selection).classList.remove('selected_hashtag_search');
			if (edit_hashtags_list.indexOf(selection) > -1) {
				edit_hashtags_list.splice(edit_hashtags_list.indexOf(parseInt(selection)), 1);
			}
		} else {
			document.getElementById("hashtag_search_term_" + selection).setAttribute('picked', true)
			document.getElementById("hashtag_search_term_" + selection).classList.add('selected_hashtag_search');
			edit_hashtags_list.push(parseInt(selection));
		}
	}
}

function autopilot_draw_hashtag_tag(value, destination) {
	var div = document.createElement("div");
	div.classList.add("hashtag_list_entry");
	var split_hashtag = value.split("|");
	if (split_hashtag.length == 1) {
		div.innerHTML = split_hashtag[0] + "&nbsp;";
	} else {
		div.innerHTML = split_hashtag[0] + " if " + parse_hashtag_filters(split_hashtag[1]) + "&nbsp;";
	}

	destination.appendChild(div);
}

function autopilot_draw_hashtag_tag_old(value, index, type, search, destination) {
	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.classList.add("topic_button_selected");
	div.style.width = "initial";
	div.style.display = "inline-block";
	div.style.textTransform = "none";
	div.innerHTML = value;
	div.setAttribute("hashtag", index);
	div.setAttribute("search", search);
	div.setAttribute("type", type);
	div.addEventListener("click", function(event) {
		autopilot_remove_hashtag(event);
	});

	destination.appendChild(div);
}

var temp_hashtag;
function autopilot_add_hashtag() {
	if (document.getElementById("autopilot_hashtags").value.trim() == "") {
		return;
	}
	autopilot_draw_hashtags();
	var cur_hashtag_split = document.getElementById("autopilot_hashtags").value.trim().replace(/\s+/g, ' ').split(' ');
	var hashtag_filter = document.getElementById("autopilot_hashtags_filters").value.trim().replace(/\s+/g, ' ');

	for (var i = 0; i < cur_hashtag_split.length; i++) {
		if (cur_hashtag_split[i].substr(0,1) != "#" && cur_hashtag_split[i].substr(0,1) != "@") {
			cur_hashtag_split[i] = "#" + cur_hashtag_split[i];
		}
	}

	temp_hashtag = cur_hashtag_split.join(' ');
	if (hashtag_filter != "") {
		temp_hashtag = temp_hashtag + "|" + hashtag_filter;
	}
	if (hashtag_filter == "") {
		document.getElementById("autopilot_hashtags_screen1_hashtag").innerHTML = temp_hashtag;
	} else {
		document.getElementById("autopilot_hashtags_screen1_hashtag").innerHTML = cur_hashtag_split.join(' ') + " if " + parse_hashtag_filters(hashtag_filter);
	}
	document.getElementById("autopilot_hashtags_screen1").style.display = "block";
	document.getElementById("autopilot_form_bottom").style.display = "none";
	document.getElementById("autopilot_form_top").style.display = "none";
	window.scrollTo(0,0);
}

var edit_hashtags_list = new Array();

var edit_searches = new Array();
var old_fixed = new Object();
function autopilot_hashtag_screen1_next() {
	old_fixed = new Object();

	if (edit_hashtags_list.length == 0) {
		return;
	}

	for (var i = 0; i < edit_hashtags_list.length; i++) {
		if (edit_hashtags_list[i] == -1) {
			old_fixed[edit_hashtags_list[i]] = JSON.parse(JSON.stringify(cur_autopilot.hashtags.fixed));
		} else {
			old_fixed[edit_hashtags_list[i]] = JSON.parse(JSON.stringify(cur_autopilot.hashtags.search[edit_hashtags_list[i]].fixed));
		}
	}

	//var temp_split = temp_hashtag.replace(/#/g, " ").split(" ");
	//var split_hashtags = temp_split.filter(function(item, index) { return temp_split.indexOf(item) >= index; });

	//close_autopilot_hashtags(false);
	if (edit_hashtags_list.includes(-1)) {
		old_fixed[-1] = JSON.parse(JSON.stringify(cur_autopilot.hashtags.fixed));
		var test_hashtags = new Array();
		for (var i = 0; i < cur_autopilot.hashtags.fixed.length; i++) {
			test_hashtags.push(cur_autopilot.hashtags.fixed[i].toLowerCase());
		}
		for (var i = 0; i < cur_autopilot.hashtags.variable.length; i++) {
			test_hashtags.push(cur_autopilot.hashtags.variable[i].toLowerCase());
		}

		if (test_hashtags.indexOf(temp_hashtag.toLowerCase()) == -1) {
			if (temp_hashtag.indexOf("|") == -1) {
				cur_autopilot.hashtags.variable.push(temp_hashtag);
			} else {
				cur_autopilot.hashtags.fixed.push(temp_hashtag);
			}
		}
	} else {
		for (var s = 0; s < edit_hashtags_list.length; s++) {
			let edit_search = edit_hashtags_list[s];
			old_fixed[edit_search] = JSON.parse(JSON.stringify(cur_autopilot.hashtags.search[edit_search].fixed));
			var test_hashtags = new Array();
			for (var i = 0; i < cur_autopilot.hashtags.search[edit_search].fixed.length; i++) {
				test_hashtags.push(cur_autopilot.hashtags.search[edit_search].fixed[i].toLowerCase());
			}
			for (var i = 0; i < cur_autopilot.hashtags.search[edit_search].variable.length; i++) {
				test_hashtags.push(cur_autopilot.hashtags.search[edit_search].variable[i].toLowerCase());
			}
			if (test_hashtags.indexOf(temp_hashtag.toLowerCase()) == -1) {
				if (temp_hashtag.indexOf("|") == -1) {
					cur_autopilot.hashtags.search[edit_search].variable.push(temp_hashtag);
				} else {
					cur_autopilot.hashtags.search[edit_search].fixed.push(temp_hashtag);
				}
			}
		}
	}
	autopilot_edit_hashtags_next();
}
function autopilot_edit_schedule(hide) {
	if (hide) {
		document.getElementById("schedule_display").style.display="none";
		document.getElementById("schedule_edit").style.display="block";
	} else {
		document.getElementById("schedule_display").style.display="block";
		document.getElementById("schedule_edit").style.display="none";
	}
}
function autopilot_edit_domains(hide) {
	if (hide) {
		document.getElementById("domains_display").style.display="none";
		document.getElementById("domains_edit").style.display="block";
	} else {
		document.getElementById("domains_display").style.display="block";
		document.getElementById("domains_edit").style.display="none";
	}
}

var edit_search_hashtags;
var edit_search_hashtags_variable_count;

function autopilot_edit_hashtags_next() {
	console.log("edit_hashtags_list: " + JSON.stringify(edit_hashtags_list));
	if (edit_hashtags_list.length == 0) {
		close_autopilot_hashtags(false);
		return;
	}
	window.scrollTo(0,0);
	edit_search = edit_hashtags_list.shift();

	var fixed;
	var variable;
	edit_search_hashtags_variable_count = 1;
	if (edit_search == -1) {
		fixed = cur_autopilot.hashtags.fixed;
		variable = cur_autopilot.hashtags.variable;
		if (cur_autopilot.hashtags.variable_count != null) {
			edit_search_hashtags_variable_count = cur_autopilot.hashtags.variable_count;
		}
	} else {
		fixed = cur_autopilot.hashtags.search[edit_search].fixed;
		variable = cur_autopilot.hashtags.search[edit_search].variable;
		if (cur_autopilot.hashtags.search[edit_search].variable_count != null) {
			edit_search_hashtags_variable_count = cur_autopilot.hashtags.search[edit_search].variable_count;
		}
	}

	document.getElementById("autopilot_hashtags_screen1").style.display = "none";
	document.getElementById("autopilot_hashtags_screen2").style.display = "block";
	document.getElementById("autopilot_form_bottom").style.display = "none";
	document.getElementById("autopilot_form_top").style.display = "none";
	if (edit_search == -1) {
		document.getElementById("autopilot_hashtags_screen2_hashtag").innerHTML = "Organize Hashtags For Every Post";
	} else {
		var label_text = "";
		for (var i = 0; i < search_terms_labels.length; i++) {
			if (search_terms_labels[i].index == edit_search) {
				label_text = search_terms_labels[i].title;
			}
		}
		document.getElementById("autopilot_hashtags_screen2_hashtag").innerHTML = "Organize Hashtags For '" + label_text + "' Posts";
	}

	edit_search_hashtags = new Array();
	for (var i = 0; i < fixed.length; i++) {
		edit_search_hashtags.push({hashtag:fixed[i],variable:false});
	}
	for (var i = 0; i < variable.length; i++) {
		edit_search_hashtags.push({hashtag:variable[i],variable:true});
	}

	edit_search_hashtags.sort (function(a, b) {
		return a.hashtag.toLowerCase().localeCompare(b.hashtag.toLowerCase());
	});
	autopilot_edit_hashtags_draw();
}

function autopilot_edit_hashtags_draw() {
	autopilot_edit_hashtag_set_variable_count();

	var report_string = "<table>";

	for (var i = 0; i < edit_search_hashtags.length; i++) {
		var toggle = "0px";
		if ( edit_search_hashtags[i].variable) {
			toggle = "18px";
		}
		if (edit_search_hashtags[i].hashtag.indexOf("|") == -1) {
			report_string = report_string + "<tr><td><input type='text' id='autopilot_hashtag_edit_" + i + "' value='" + edit_search_hashtags[i].hashtag + "' style='width: 200px;border: 1px solid #ccc' /></td><td style='width: 180px;text-align: center'>All<div class='toggle_outside' onclick='hashtag_toggle(" + edit_search + "," + i + ")'><div class='toggle_inside' id='hashtag_toggle_"+ edit_search + "_" + i + "' style='left: " + toggle + "'></div></div>Variable</td><td style='width: 90px;text-align: center'><input type='button' value='Delete' onclick='autopilot_remove_hashtag(" + i + ")' /></td></tr>";
		} else {
			var hashtag_split = edit_search_hashtags[i].hashtag.split("|");
			report_string = report_string + "<tr><td><input type='text' id='autopilot_hashtag_edit_" + i + "' value='" + hashtag_split[0] + " if " + parse_hashtag_filters(hashtag_split[1]).replaceAll("'", "&quot;") + "' style='width: 200px;border: 1px solid #ccc' disabled /></td><td style='width: 180px;text-align: center;opacity: 0.5'>All<div class='toggle_outside' ><div class='toggle_inside' id='hashtag_toggle_"+ edit_search + "_" + i + "' style='left: " + toggle + "'></div></div>Variable</td><td style='width: 90px;text-align: center'><input type='button' value='Delete' onclick='autopilot_remove_hashtag(" + i + ")' /></td></tr>";
		}
	}
	document.getElementById("autopilot_hashtag_organizer").innerHTML = report_string + "</table>";
}

function autopilot_edit_hashtag_set_variable_count() {
	remove_all_children(document.getElementById("autopilot_hashtag_variable_count"));

	var variable_total = 0;
	for (var i = 0; i < edit_search_hashtags.length; i++) {
		if (edit_search_hashtags[i].variable) {
			variable_total++;
		}
	}

	for (var i = 1; i < variable_total; i++) {
		var opt = document.createElement("option");
		opt.text = i;
		opt.value = i;
		document.getElementById("autopilot_hashtag_variable_count").options.add(opt);
	}
	if (edit_search_hashtags_variable_count >= variable_total && variable_total > 1) {
		edit_search_hashtags_variable_count = variable_total - 1;
	}

	if (variable_total < 2) {
		document.getElementById("autopilot_hashtag_variable_count_display").style.display = "none";
	} else {
		document.getElementById("autopilot_hashtag_variable_count_display").style.display = "table-row";
	}

	document.getElementById("autopilot_hashtag_variable_count").value = edit_search_hashtags_variable_count;
}

function hashtag_toggle(search, id) {
	if (typeof edit_search_hashtags[id] == "string" && edit_search_hashtags[id].indexOf("|") != -1) {
		return;
	}
	if (document.getElementById("hashtag_toggle_"+ search + "_" + id).style.left == "0px") {
		document.getElementById("hashtag_toggle_"+ search + "_" + id).style.left = "18px";
	} else {
		document.getElementById("hashtag_toggle_"+ search + "_" + id).style.left = "0px";
	}
	edit_search_hashtags[id].variable = !edit_search_hashtags[id].variable;
	setTimeout("autopilot_edit_hashtags_draw();", 250);
}

function autopilot_remove_hashtag(id) {
	edit_search_hashtags.splice(id, 1);
	autopilot_edit_hashtags_draw();
}

function close_autopilot_hashtags(undo) {
	console.log("close_autopilot_hashtags");
	if (edit_hashtags_list.length > 0) {
		autopilot_edit_hashtags_next();
		return;
	}
	document.getElementById("autopilot_hashtags").value = "";
	document.getElementById("autopilot_hashtags_filters").value = "";

	if (undo) {
		for (var s = 0; s < edit_hashtags_list.length; s++) {
			let edit_search = edit_hashtags_list[s];

			if (edit_search == -1) {
				cur_autopilot.hashtags.fixed = old_fixed[-1];
			} else {
				cur_autopilot.hashtags.search[edit_search].fixed = old_fixed[edit_search];
			}
		}
	}
	window.scrollTo(0,0);
	document.getElementById("autopilot_hashtags_screen1").style.display = "none";
	document.getElementById("autopilot_hashtags_screen2").style.display = "none";
	document.getElementById("autopilot_form_bottom").style.display = "block";
	document.getElementById("autopilot_form_top").style.display = "table";
}

function save_autopilot_hashtags() {
	var variable = new Array();
	var fixed = new Array();

	for (var i = 0; i < edit_search_hashtags.length; i++) {
		if (edit_search_hashtags[i].hashtag.indexOf("|") == -1 && document.getElementById("autopilot_hashtag_edit_" + i).value.trim() != "") {
			edit_search_hashtags[i].hashtag = document.getElementById("autopilot_hashtag_edit_" + i).value.trim();
			if (edit_search_hashtags[i].hashtag.indexOf("#") != 0 && edit_search_hashtags[i].hashtag.indexOf("@") != 0) {
				edit_search_hashtags[i].hashtag = "#" + edit_search_hashtags[i].hashtag;
			}
			console.log("Updated hashtag: " + edit_search_hashtags[i].hashtag);
		}
		if (edit_search_hashtags[i].variable) {
			variable.push(edit_search_hashtags[i].hashtag);
		} else {
			fixed.push(edit_search_hashtags[i].hashtag);
		}
	}

	if (edit_search == -1) {
		cur_autopilot.hashtags.fixed = fixed;
		cur_autopilot.hashtags.variable = variable;
		cur_autopilot.hashtags.variable_count = document.getElementById("autopilot_hashtag_variable_count").value;
	} else {
		cur_autopilot.hashtags.search[edit_search].fixed = fixed;
		cur_autopilot.hashtags.search[edit_search].variable = variable;
		cur_autopilot.hashtags.search[edit_search].variable_count = document.getElementById("autopilot_hashtag_variable_count").value;
	}

	close_autopilot_hashtags(false);
	autopilot_draw_hashtags()
}

function autopilot_toggle_video_only() {
	if (document.getElementById("autopilot_feed_video_only").checked) {
		cur_autopilot.feed_video_only = 1;
	} else {
		cur_autopilot.feed_video_only = 0;
	}
}

function autopilot_toggle_email_day(day) {
	if (document.getElementById("autopilot_email_schedule_day_" + day).checked) {
		cur_autopilot["email_" + day] = 1;
	} else {
		cur_autopilot["email_" + day] = 0;
	}
}

function autopilot_add_new_feed(feed) {
	if (document.getElementById("autopilot_add_new_feed_button").value == "Add") {
		document.getElementById("autopilot_add_new_feed_button").value = "Back";
	} else {
		document.getElementById("autopilot_add_new_feed_button").value = "Add";
		autopilot_add_feed();
		return;
	}

	document.getElementById("autopilot_feed_title").value = feed;
	document.getElementById("autopilot_feed_entry").style.display = "block";
	document.getElementById("autopilot_feed_list").style.display = "none";
}

function autopilot_add_feed() {
	var feed = document.getElementById("autopilot_feed_title").value.replace(/[^a-zA-Z0-9-_ ]/g, "");
	document.getElementById("autopilot_feed_title").value = feed;
	if (feed == "") {
		autopilot_show_feed();
		return;
	}

	var feeds = state.services.list.fields[0].feeds.split("|");
	if (feeds.indexOf(feed) == -1) {
		feeds.push(feed);
		state.services.list.fields[0].feeds = feeds.join("|");
	}

	save_fields();

	autopilot_select_feed(feed);
}
function autopilot_show_feed() {
	if (cur_autopilot.feed == "") {
		autopilot_draw_feeds();
		return;
	}
	document.getElementById("autopilot_feed_entry").style.display = "none";
	document.getElementById("autopilot_feed_list").style.display = "block";
	remove_all_children(document.getElementById("autopilot_feed_list"));

	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.innerHTML = cur_autopilot.feed + " <div style='float:right'>&#9660;</div>";
	div.addEventListener("click", function(event) {
		autopilot_draw_feeds();
	});
	document.getElementById("autopilot_feed_list").appendChild(div);

	if (state.screen_name == "") {
		update_screen_name();
	}

	var feed_url = "http://www.mondoplayer.com/rss/" + state.screen_name.replace(/ /g, '_') + "_" + cur_autopilot.feed.trim().replace(/ /g, '_') + ".rss";

	document.getElementById("autopilot_feed_url").innerHTML = "<input type='text' id='autopilot_feed_url_text' value='" + feed_url + "' style='width: 400px' readonly /> <input type='button' value='Copy' onclick='copy_url(\"autopilot_feed_url_text\")' />";

	var feed_url_with_hashtags = "http://www.mondoplayer.com/rss/" + state.screen_name.replace(/ /g, '_') + "_" + cur_autopilot.feed.trim().replace(/ /g, '_') + "_with_hashtags.rss";
	document.getElementById("autopilot_hashtags_feed_url").innerHTML = "<input type='text' id='autopilot_hashtags_feed_url_text' value='" + feed_url + "' style='width: 400px' readonly /> <input type='button' value='Copy' onclick='copy_url(\"autopilot_hashtags_feed_url_text\")' />";
}

function autopilot_draw_feeds() {
	document.getElementById("autopilot_add_new_feed_button").value = "Add";
	var feeds = state.services.list.fields[0].feeds.split("|");
	document.getElementById("autopilot_feed_entry").style.display = "none";
	document.getElementById("autopilot_feed_list").style.display = "block";
	remove_all_children(document.getElementById("autopilot_feed_list"));
	for (var i = 0; i < feeds.length; i++) {
		if (feeds[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");

		var feed_entry_select = document.createElement("div");
		feed_entry_select.classList.add("feed_entry_edit");
		feed_entry_select.innerHTML = "Select";
		feed_entry_select.setAttribute("feed", feeds[i].trim());
		feed_entry_select.addEventListener("click", function(event) {
			autopilot_select_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_select);

		var feed_entry_title = document.createElement("div");
		feed_entry_title.classList.add("feed_entry_title");
		feed_entry_title.innerHTML = feeds[i].trim();
		feed_entry_title.setAttribute("feed", feeds[i].trim());
		feed_entry_title.addEventListener("click", function(event) {
			autopilot_select_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_title);

		var feed_entry_delete = document.createElement("div");
		feed_entry_delete.classList.add("feed_entry_delete");
		feed_entry_delete.innerHTML = "-";
		feed_entry_delete.setAttribute("feed", feeds[i].trim());
		feed_entry_delete.addEventListener("click", function(event) {
			autopilot_delete_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_delete);

		var feed_entry_edit = document.createElement("div");
		feed_entry_edit.classList.add("feed_entry_edit");
		feed_entry_edit.innerHTML = "Edit";
		feed_entry_edit.setAttribute("feed", feeds[i].trim());
		feed_entry_edit.addEventListener("click", function(event) {
			autopilot_add_new_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_edit);

		document.getElementById("autopilot_feed_list").appendChild(div);
	}
}

function autopilot_select_feed(feed) {
	document.getElementById("autopilot_add_new_feed_button").value = "Add";
	cur_autopilot.feed = feed;
	autopilot_show_feed();
}

var cur_feed = ""
function autopilot_delete_feed(feed) {
	cur_feed = feed;
	show_confirm("Are you sure you want to delete the feed '" + feed + "'?", autopilot_confirm_delete_feed, "Ok"); 
}

function autopilot_confirm_delete_feed() {
	var feeds = state.services.list.fields[0].feeds.split("|");
	feeds.splice(feeds.indexOf(cur_feed), 1);
	state.services.list.fields[0].feeds = feeds.join("|");

	if (cur_autopilot.feed == cur_feed) {
		if (feeds.length > 0) {
			cur_autopilot.feed = feeds[0]
		} else {
			cur_autopilot.feed = "";
		}
	}

	autopilot_draw_feeds();
	save_fields();
	hide_message();
}

function autopilot_add_new_campaign(campaign) {
	if (document.getElementById("autopilot_add_new_campaign_button").value == "Add") {
		document.getElementById("autopilot_add_new_campaign_button").value = "Back";
	} else {
		document.getElementById("autopilot_add_new_campaign_button").value = "Add";
		autopilot_add_campaign();
		return;
	}

	document.getElementById("autopilot_campaign_title").value = campaign;
	document.getElementById("autopilot_campaign_entry").style.display = "block";
	document.getElementById("autopilot_campaign_list").style.display = "none";
}

function autopilot_add_campaign() {
	var campaign = document.getElementById("autopilot_campaign_title").value.trim();
	if (campaign == "") {
		autopilot_show_campaign();
		return;
	}

	var campaigns = state.services.list.fields[0].campaigns.split("|");
	if (campaigns.indexOf(campaign) == -1) {
		campaigns.push(campaign);
		state.services.list.fields[0].campaigns = campaigns.join("|");
	}

	save_fields();
	autopilot_select_campaign(campaign);
}

function autopilot_show_campaign() {
	if (cur_autopilot.campaign == "") {
		autopilot_draw_campaigns();
		return;
	}
	document.getElementById("autopilot_add_new_campaign_button").value = "Add";
	document.getElementById("autopilot_campaign_entry").style.display = "none";
	document.getElementById("autopilot_campaign_list").style.display = "block";
	remove_all_children(document.getElementById("autopilot_campaign_list"));

	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.innerHTML = cur_autopilot.campaign + " <div style='float:right'>&#9660;</div>";
	div.addEventListener("click", function(event) {
		autopilot_draw_campaigns();
	});
	document.getElementById("autopilot_campaign_list").appendChild(div);
}

function autopilot_draw_campaigns() {
	document.getElementById("autopilot_add_new_campaign_button").value = "Add";
	
	var campaigns = state.services.list.fields[0].campaigns.split("|");
	document.getElementById("autopilot_campaign_entry").style.display = "none";
	document.getElementById("autopilot_campaign_list").style.display = "block";
	remove_all_children(document.getElementById("autopilot_campaign_list"));
	for (var i = 0; i < campaigns.length; i++) {
		if (campaigns[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");

		var campaign_entry_title = document.createElement("div");
		campaign_entry_title.classList.add("feed_entry_title");
		campaign_entry_title.innerHTML = campaigns[i].trim();
		campaign_entry_title.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_title.addEventListener("click", function(event) {
			autopilot_select_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_title);

		var campaign_entry_delete = document.createElement("div");
		campaign_entry_delete.classList.add("feed_entry_delete");
		campaign_entry_delete.innerHTML = "-";
		campaign_entry_delete.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_delete.addEventListener("click", function(event) {
			autopilot_delete_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_delete);

		var campaign_entry_edit = document.createElement("div");
		campaign_entry_edit.classList.add("feed_entry_edit");
		campaign_entry_edit.innerHTML = "Edit";
		campaign_entry_edit.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_edit.addEventListener("click", function(event) {
			autopilot_add_new_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_edit);

		document.getElementById("autopilot_campaign_list").appendChild(div);
	}
}

function autopilot_select_campaign(campaign) {
	document.getElementById("autopilot_add_new_campaign_button").value = "Add";
	cur_autopilot.campaign = campaign;
	autopilot_show_campaign();
}

var cur_campaign = ""
function autopilot_delete_campaign(campaign) {
	cur_campaign = campaign;
	show_confirm("Are you sure you want to delete the campaign '" + campaign + "'?", autopilot_confirm_delete_campaign, "Ok");
}

function autopilot_confirm_delete_campaign() {
	var campaigns = state.services.list.fields[0].campaigns.split("|");
	campaigns.splice(campaigns.indexOf(cur_campaign), 1);
	state.services.list.fields[0].campaigns = campaigns.join("|");

	if (cur_autopilot.campaign == cur_campaign) {
		if (campaigns.length > 0) {
			cur_autopilot.campaign = campaigns[0]
		} else {
			cur_autopilot.campaign = "";
		}
	}

	save_fields();
	autopilot_draw_campaigns();
	hide_message();
}

function autopilot_add_exclude(domain) {
	var excluded_domains = cur_autopilot.excluded_domains.split("|");
	if (domain.trim() == "" || excluded_domains.indexOf(domain) > -1) {
		return;
	}

	var new_domains = domain.trim().split(" ");

	for (var i = 0; i < new_domains.length; i++) {
		var new_domain = trim_domain(new_domains[i], true);
		if (new_domain != "") {
			excluded_domains.push(new_domain);
		}
	}
	excluded_domains.sort();

	cur_autopilot.excluded_domains = excluded_domains.join("|");
	autopilot_draw_excluded_domains();
}

function autopilot_delete_exclude(domain) {
	var excluded_domains = cur_autopilot.excluded_domains.split("|");
	if (excluded_domains.indexOf(domain) == -1) {
		return;
	}

	excluded_domains.splice(excluded_domains.indexOf(domain), 1);
	cur_autopilot.excluded_domains = excluded_domains.join("|");

	autopilot_draw_excluded_domains();
}

function update_autopilot_title() {
	if (document.getElementById("autopilot_title").value.trim() != "") {
		if (cur_autopilot.feed == "" && state.services.list.fields[0].feeds == "") {
			document.getElementById("autopilot_feed_title").value = document.getElementById("autopilot_title").value.trim();
			autopilot_add_feed();
		}
	}
}

function autopilot_select_service() {
	cur_autopilot.service = document.getElementById("autopilot_service").value;
	var flags = 0;
	for (var i = 0; i < state.services.list.services.length; i++) {
		if (state.services.list.services[i].service_id == cur_autopilot.service) {
			flags = state.services.list.services[i].service_flags;
			break;
		}
	}

	if ((flags & 2) > 0) {
		document.getElementById("autopilot_campaign_details").style.display = "table";
	} else {
		document.getElementById("autopilot_campaign_details").style.display = "none";
	}

	document.getElementById("autopilot_email_schedule_details").style.display = "none";
	if ((flags & 32) == 0 && (cur_autopilot.service != 1 && cur_autopilot.service != 11 && cur_autopilot.service != 9 && cur_autopilot.service != -1 && cur_autopilot.service != 15 )) {
		document.getElementById("autopilot_email_schedule_details").style.display = "table";
	}

	if (cur_autopilot.service == 1 || cur_autopilot.service == 11) {
		document.getElementById("autopilot_api_details").style.display = "table";
		if (cur_autopilot.service == 1) {
			autopilot_draw_buffer_profiles();
		} else {
			autopilot_draw_spredfast_profiles();
		}
	} else { 
		document.getElementById("autopilot_api_details").style.display = "none";
	}
	if (cur_autopilot.service == 10) {
		document.getElementById("autopilot_rss_details").style.display = "table";
		document.getElementById("autopilot_thumbnail_details").style.display = "table";
	} else {
		document.getElementById("autopilot_rss_details").style.display = "none";
		document.getElementById("autopilot_thumbnail_details").style.display = "none";
	}
	if (cur_autopilot.service == 15) {
		document.getElementById("autopilot_categories_details").style.display = "table";
		document.getElementById("autopilot_thumbnail_details").style.display = "table";
	} else {
		document.getElementById("autopilot_categories_details").style.display = "none";
		document.getElementById("autopilot_thumbnail_details").style.display = "none";
	}
	autopilot_draw_hashtags();
}

function autopilot_draw_buffer_profiles() {
	if (! update_buffer_profiles()) {
		return;
	}

	remove_all_children(document.getElementById("autopilot_api_service_picker"));
	for (var i = 0; i < buffer.profiles.length; i++) {

		var div = document.createElement("div");
		div.classList.add("buffer_profile");

		var checked = "";
		if (cur_autopilot.buffer_profiles_split.length > 0 && cur_autopilot.buffer_profiles_split.indexOf(buffer.profiles[i]["id"]) > -1) {
			checked = "checked"
		}

		var content = "<input style='width: auto;height: auto' type='checkbox' id='buffer_" + buffer.profiles[i]["id"] + "' " + checked + " onclick='toggle_buffer_profile(\"" + buffer.profiles[i]["id"] + "\")' /> " + buffer.profiles[i]["service_username"];

		if (buffer.profiles[i]["service"] == "twitter") {
			content = content + " <img src='" + image_url + "twitter_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "facebook") {
			content = content + " <img src='" + image_url + "facebook_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "google") {
			content = content + " <img src='" + image_url + "gplus_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "linkedin") {
			content = content + " <img src='" + image_url + "linkedin_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "appdotnet") {
			content = content + " <img src='" + image_url + "appnet_profile.png' />";
		}

		div.innerHTML = content;

		document.getElementById("autopilot_api_service_picker").appendChild(div);
	}
}

function update_buffer_profiles() {
	if (buffer.buffer_key == "") {
		get_buffer_key();
	}

	if (buffer.buffer_key == "") {
		show_buffer_authorize();
		return false;
	}

	if (buffer.profiles.length == 0) {
		var url = "https://www.mondoplayer.com/bufferapp.php?regKey=" + state.regKey + "&p=" + encodeURIComponent("access_token=" + buffer.buffer_key);
		var xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();


		if (xmlhttp.responseText != null && xmlhttp.responseText != "") {
			if (xmlhttp.responseText.match("\"code\":401")) {
				show_buffer_authorize();
				return false;
			}
			buffer.profiles = JSON.parse(xmlhttp.responseText);
		} else { 
			show_message("Unable to connect to your buffer account, please try again", true, 0, "block");
			return false;
		}
	}
	return true;
}


function toggle_buffer_profile(id) {
	if (document.getElementById("buffer_" + id).checked) {
		if (cur_autopilot.buffer_profiles_split.indexOf(id) > -1) {

		} else {
			cur_autopilot.buffer_profiles_split.push(id);
			cur_autopilot.buffer_profiles = cur_autopilot.buffer_profiles_split.join(",");
		}
	} else {
		if (cur_autopilot.buffer_profiles_split.indexOf(id) > -1) {
			cur_autopilot.buffer_profiles_split.splice(cur_autopilot.buffer_profiles_split.indexOf(id), 1);
			cur_autopilot.buffer_profiles = cur_autopilot.buffer_profiles_split.join(",");
		} else {
		}
	}
}

function show_buffer_authorize() {
	show_confirm("You need to authorize MondoPlayer to work with Buffer", buffer_authorize, "Authorize", false);
}

function buffer_authorize() {
	show_confirm("Return to MondoPlayer", confirm_buffer_authorize, "OK", true);
	window.open("https://www.mondoplayer.com/bufferapp.php?regKey=" + state.regKey);
	return true;
}

function confirm_buffer_authorize() {
	hide_message();
	bulk_submit_draw_buffer_profiles();
	autopilot_draw_buffer_profiles();
}

function get_buffer_key() {
	try	{
		var url = "https://www.mondoplayer.com/bufferapp.php?get_token=1&regKey=" + license_key;

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();


		if (xmlhttp.responseText == "403") {
			console.log("get_buffer_key: 403");
			log_back_in();
			return;
		}

		buffer.buffer_key = xmlhttp.responseText;
	}
	catch (e) {
		console.log(JSON.stringify(e));
		show_message("There was an error getting your Buffer key, please try again.", true, 0, "block");
	}
}

function autopilot_draw_spredfast_profiles() {
	if (! update_spredfast_profiles()) {
		return;
	}

	remove_all_children(document.getElementById("autopilot_api_service_picker"));

	for (var i = 0; i < spredfast.accounts.length; i++ ) {
		var div = document.createElement("div");
		div.classList.add("buffer_profile");

		var checked = "";

		if (cur_autopilot.spredfast_service != null && cur_autopilot.spredfast_service == spredfast.accounts[i].id) {
			checked = "checked"
		}

		var content = "<input style='width: auto;height: auto' type='checkbox' id='spredfast_" + spredfast.accounts[i]["id"] + "' " + checked +" onclick='toggle_spredfast_profile(" + spredfast.accounts[i]["id"] + ")' /> " + spredfast.accounts[i]["name"];

		if (spredfast.accounts[i]["service"] == "TWITTER") {
			content = content + " <img src='" + image_url + "twitter_profile.png' />";
		} else if (spredfast.accounts[i]["service"] == "FACEBOOK") {
			content = content + " <img src='" + image_url + "facebook_profile.png' />";
		}

		div.innerHTML = content;

		document.getElementById("autopilot_api_service_picker").appendChild(div);
	}
}

function update_spredfast_profiles() {
	if (spredfast.spredfast_key == "") {
		get_spredfast_key();
	}

	if (spredfast.spredfast_key == "") {
		show_spredfast_authorize();
		return false;
	}

	if (spredfast.accounts.length > 0) {
		return true;
	}

	var url = "https://www.mondoplayer.com/spredfastapp.php?regKey=" + state.regKey + "&p=" + encodeURIComponent("/v1/me/") + "&t=" + encodeURIComponent(spredfast.spredfast_key);
	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send();


	if (xmlhttp.responseText != null && xmlhttp.responseText != "") {
		if (xmlhttp.responseText.match("\"code\":401")) {
			show_spredfast_authorize();
			return false;
		}
		var results = JSON.parse(xmlhttp.responseText);
		if (results.code == "unauthenticated") {
			show_spredfast_authorize();
			return false;
		}
		spredfast.companies = new Array();
		for (var i = 0; i < results.data.companies.length; i++) {
			console.log ("Adding spredfast.companies " + results.data.companies[i].name);

			var cur_company = new Object();
			cur_company.id = results.data.companies[i].id;
			cur_company.name = results.data.companies[i].name;
			cur_company.environment = results.data.companies[i].environment;

			spredfast.companies.push(cur_company);
		}
	} else {
		show_spredfast_authorize();
		return false;
	}

	for (var i = 0; i < spredfast.companies.length; i++ ) {
		var url = "https://www.mondoplayer.com/spredfastapp.php?regKey=" + state.regKey + "&p=" + encodeURIComponent("/" + spredfast.companies[i].environment + "/v1/company/" + spredfast.companies[i].id + "/initiative" ) + "&t=" + encodeURIComponent(spredfast.spredfast_key);

		xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();


		if (xmlhttp.responseText != null && xmlhttp.responseText != "") {
			if (xmlhttp.responseText.match("\"code\":401")) {
				show_spredfast_authorize();
				return false;
			}
			var results = JSON.parse(xmlhttp.responseText);
			spredfast.initiatives = new Array();
			for (var t = 0; t < results.data.length; t++) {

				var cur_initiative = new Object();
				cur_initiative.id = results.data[t].id;
				cur_initiative.name = results.data[t].name;
				
				cur_initiative.company_id = spredfast.companies[i].id;
				cur_initiative.company_environment = spredfast.companies[i].environment;
				spredfast.initiatives.push(cur_initiative);
			}
		}
	}

	for (var i = 0; i < spredfast.initiatives.length; i++ ) {
		var url = "https://www.mondoplayer.com/spredfastapp.php?regKey=" + state.regKey + "&p=" + encodeURIComponent("/" + spredfast.initiatives[i].company_environment + "/v1/company/" + spredfast.initiatives[i].company_id + "/initiative/" + spredfast.initiatives[i].id + "/accountset" ) + "&t=" + encodeURIComponent(spredfast.spredfast_key);

		xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();

		if (xmlhttp.responseText != null && xmlhttp.responseText != "") {
			if (xmlhttp.responseText.match("\"code\":401")) {
				show_spredfast_authorize();
				return false;
			}
			var results = JSON.parse(xmlhttp.responseText);
			spredfast.accounts = new Array();
			for (var t = 0; t < results.data.length; t++) {
				for (var s = 0; s < results.data[t].accounts.length; s++) {
					var cur_account = new Object();
					cur_account.id = results.data[t].accounts[s].id;
					cur_account.name = results.data[t].accounts[s].name;
					cur_account.service = results.data[t].accounts[s].service;
					cur_account.accountType = results.data[t].accounts[s].accountType;
					cur_account.company_environment = spredfast.initiatives[i].company_environment;
					cur_account.company_id = spredfast.initiatives[i].company_id;
					cur_account.initiative_id = spredfast.initiatives[i].id;
					spredfast.accounts.push(cur_account);
				}
			}
		}
	}
	return true;
}

function toggle_spredfast_profile(id) {
	cur_autopilot.spredfast_service = id;
	autopilot_draw_spredfast_profiles();
}

function show_spredfast_authorize() {
	show_confirm("You need to authorize MondoPlayer to work with Spredfast", spredfast_authorize, "AUTHORIZE", false);
}

function spredfast_authorize() {
	show_confirm("Return to MondoPlayer", confirm_spredfast_authorize, "OK", true);
	window.open("https://www.mondoplayer.com/spredfastapp.php?regKey=" + state.regKey);
	return true;
}

function confirm_spredfast_authorize() {
	hide_message();
	autopilot_draw_spredfast_profiles();
	bulk_submit_draw_spredfast_profiles();
}

function get_spredfast_key() {
	try	{
		var url = "https://www.mondoplayer.com/spredfastapp.php?get_token=1&regKey=" + license_key;

		var xmlhttp = new XMLHttpRequest();	
		xmlhttp.open("GET", url, false);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send();

		if (xmlhttp.responseText == "403") {
			console.log("get_spredfast_key: 403");
			log_back_in();
			return;
		}

		spredfast.spredfast_key = xmlhttp.responseText;
	}
	catch (e) {
		console.log(JSON.stringify(e));
		show_message("There was an error getting your Spredfast key, please try again.", true, 0, "block");
	}
}

function show_bulk_submit() {
	//show_page("bulk_submit_page");
	document.getElementById("right_panel_search_page").style.display = "none";
	document.getElementById("bulk_submit_page").style.display = "block";
	document.getElementById("bulk_submit_edit_schedule").style.display = "none";
	document.getElementById("bulk_submit_page_form").style.display = "block";
	update_services(false);
	update_categories('bulk_submit');
	update_users('bulk_submit');

	if (document.getElementById("bulk_submit_service").options.length == 0) {
		var blank_opt = document.createElement("option");
		blank_opt.text = "Select a Service...";
		blank_opt.value = 0;
		document.getElementById("bulk_submit_service").options.add(blank_opt);
		for (var i = 0; i < state.services.list.services.length; i++) {
			var opt = document.createElement("option");
			opt.text = state.services.list.services[i].service_name;
			opt.value = state.services.list.services[i].service_id; 
			document.getElementById("bulk_submit_service").options.add(opt);
		}
	}

	if (state.services.list.fields[0].default_service == null || state.services.list.fields[0].default_service == 0) {
		state.services.list.fields[0].default_service = 15;
	}

	document.getElementById("bulk_submit_service").value = state.services.list.fields[0].default_service;
	set_service_select(document.getElementById("bulk_submit_service_select"));

	if (document.getElementById("bulk_submit_schedule_date").options.length == 0) {
		var start_date = new Date();
		var date_options = { month: 'long', day: 'numeric', year: 'numeric' };
		for (var i = 0; i < 31; i++) {
			var text = start_date.toLocaleDateString("en-US", date_options);
			var value = start_date.toISOString().slice(0,10);

			var opt = document.createElement("option");
			opt.text = text;
			opt.value = value; 
			document.getElementById("bulk_submit_schedule_date").options.add(opt);

			start_date.setDate(start_date.getDate() + 1);
		}
	}

	bulk_submit_show_project();
	bulk_submit_show_campaign();
	bulk_submit_show_feed();
	bulk_submit_show_schedule();
	bulk_submit_select_service();
	bulk_submit_set_start_date();
}

function bulk_submit_add_new_campaign(campaign) {
	if (document.getElementById("bulk_submit_add_new_campaign_button").value == "Add") {
		document.getElementById("bulk_submit_add_new_campaign_button").value = "Back";
	} else {
		document.getElementById("bulk_submit_add_new_campaign_button").value = "Add";
		bulk_submit_add_campaign();
		return;
	}
	document.getElementById("bulk_submit_campaign_title").value = campaign;
	document.getElementById("bulk_submit_campaign_error").style.display = "none";
	document.getElementById("bulk_submit_campaign_entry").style.display = "block";
	document.getElementById("bulk_submit_campaign_list").style.display = "none";
}

function bulk_submit_add_campaign() {
	var campaign = document.getElementById("bulk_submit_campaign_title").value.trim();
	if (campaign == "") {
		bulk_submit_show_campaign();
		return;
	}

	var campaigns = state.services.list.fields[0].campaigns.split("|");
	if (campaigns.indexOf(campaign) == -1) {
		campaigns.push(campaign);
		state.services.list.fields[0].campaigns = campaigns.join("|");
		state.services.list.fields[0].default_campaign = campaigns.length - 1;
	}

	save_fields();
	bulk_submit_select_campaign(campaign);
}

function bulk_submit_show_campaign() {
	if (state.services.list.fields[0].default_campaign == null) {
		bulk_submit_draw_campaigns();
		return;
	}
	if (state.services.list.fields[0].campaigns == "") {
		return;
	}

	var campaigns = state.services.list.fields[0].campaigns.split("|");
	document.getElementById("bulk_submit_campaign_entry").style.display = "none";
	document.getElementById("bulk_submit_campaign_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_campaign_list"));

	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.innerHTML = campaigns[parseInt(state.services.list.fields[0].default_campaign)] + " <div style='float:right'>&#9660;</div>";
	div.addEventListener("click", function(event) {
		bulk_submit_draw_campaigns();
	});
	document.getElementById("bulk_submit_campaign_list").appendChild(div);
}

function bulk_submit_draw_campaigns() {
	document.getElementById("bulk_submit_add_new_campaign_button").value = "Add";
	var campaigns = state.services.list.fields[0].campaigns.split("|");
	document.getElementById("bulk_submit_campaign_entry").style.display = "none";
	document.getElementById("bulk_submit_campaign_error").style.display = "none";
	document.getElementById("bulk_submit_campaign_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_campaign_list"));
	for (var i = 0; i < campaigns.length; i++) {
		if (campaigns[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");

		var campaign_entry_select = document.createElement("div");
		campaign_entry_select.classList.add("feed_entry_edit");
		campaign_entry_select.innerHTML = "Select";
		campaign_entry_select.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_select.addEventListener("click", function(event) {
			bulk_submit_select_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_select);


		var campaign_entry_title = document.createElement("div");
		campaign_entry_title.classList.add("feed_entry_title");
		campaign_entry_title.innerHTML = campaigns[i].trim();
		campaign_entry_title.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_title.addEventListener("click", function(event) {
			bulk_submit_select_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_title);

		var campaign_entry_delete = document.createElement("div");
		campaign_entry_delete.classList.add("feed_entry_delete");
		campaign_entry_delete.innerHTML = "-";
		campaign_entry_delete.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_delete.addEventListener("click", function(event) {
			bulk_submit_delete_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_delete);

		var campaign_entry_edit = document.createElement("div");
		campaign_entry_edit.classList.add("feed_entry_edit");
		campaign_entry_edit.innerHTML = "Edit";
		campaign_entry_edit.setAttribute("campaign", campaigns[i].trim());
		campaign_entry_edit.addEventListener("click", function(event) {
			bulk_submit_add_new_campaign(event.target.getAttribute("campaign"));
		});

		div.appendChild(campaign_entry_edit);

		document.getElementById("bulk_submit_campaign_list").appendChild(div);
	}
}

function bulk_submit_select_campaign(campaign) {
	document.getElementById("bulk_submit_add_new_campaign_button").value = "Add";
	document.getElementById("bulk_submit_campaign_error").style.display = "none";
	var campaigns = state.services.list.fields[0].campaigns.split("|");
	for (var i = 0; i < campaigns.length; i++) {
		if (campaigns[i] == campaign) {
			state.services.list.fields[0].default_campaign = i;
			break;
		}
	}
	bulk_submit_show_campaign();
}

var cur_campaign = "";
function bulk_submit_delete_campaign(campaign) {
	cur_campaign = campaign;
	show_confirm("Are you sure you want to delete the campaign '" + campaign + "'?", bulk_submit_confirm_delete_campaign, "Ok"); 
}

function bulk_submit_confirm_delete_campaign() {
	var campaigns = state.services.list.fields[0].campaigns.split("|");
	campaigns.splice(campaigns.indexOf(cur_campaign), 1);
	state.services.list.fields[0].campaigns = campaigns.join("|");

	state.services.list.fields[0].default_campaign = 0;

	for (var i = 0; i < campaigns.length; i++) {
		if (campaigns[i] == campaign) {
			state.services.list.fields[0].default_campaign = i;
			break;
		}
	}

	save_fields();
	bulk_submit_draw_campaigns();
	hide_message();
}

function bulk_submit_toggle_video_only() {
	if (document.getElementById("autopilot_feed_video_only").checked) {
		state.services.list.fields[0].feed_video_only = 1;
	} else {
		state.services.list.fields[0].feed_video_only = 0;
	}
}

function bulk_submit_schedule_optional() {
	if (document.getElementById("bulk_submit_schedule_optional").checked) {
		state.default_show_optional = true;
		state.services.list.fields[0].optional
		document.getElementById("bulk_submit_schedule_details").style.display = "block";
	} else {
		state.default_show_optional = false;
		document.getElementById("bulk_submit_schedule_details").style.display = "none";
	}
}

function bulk_submit_add_new_feed(feed) {
	if (document.getElementById("bulk_submit_add_new_feed_button").value == "Add") {
		document.getElementById("bulk_submit_add_new_feed_button").value = "Back";
	} else {
		document.getElementById("bulk_submit_add_new_feed_button").value = "Add";
		bulk_submit_add_feed();
		return;
	}

	document.getElementById("bulk_submit_feed_title").value = feed;
	document.getElementById("bulk_submit_feed_entry").style.display = "block";
	document.getElementById("bulk_submit_feed_list").style.display = "none";
	document.getElementById("bulk_submit_feed_title_error").style.display = "none";
}


function bulk_submit_add_feed() {
	var feed = document.getElementById("bulk_submit_feed_title").value.replace(/[^a-zA-Z0-9-_ ]/g, "");
	if (feed == "") {
		bulk_submit_show_feed();
		return;
	}

	var feeds = state.services.list.fields[0].feeds.split("|");
	if (feeds.indexOf(feed) == -1) {
		feeds.push(feed);
		state.services.list.fields[0].feeds = feeds.join("|");
		state.services.list.fields[0].default_feed = feeds.length - 1;
	}

	save_fields();
	bulk_submit_select_feed(feed);
}

function bulk_submit_show_feed() {
	document.getElementById("bulk_submit_feed_title_error").style.display = "none";
	document.getElementById("bulk_submit_add_new_feed_button").value = "Add";

	if (state.services.list.fields[0].default_feed == null) {
		bulk_submit_draw_feeds();
		return;
	}
	if (state.services.list.fields[0].feeds == "") {
		return;
	}

	var feeds = state.services.list.fields[0].feeds.split("|");
	document.getElementById("bulk_submit_feed_entry").style.display = "none";
	document.getElementById("bulk_submit_feed_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_feed_list"));

	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.innerHTML = feeds[parseInt(state.services.list.fields[0].default_feed)] + " <div style='float:right'>&#9660;</div>";
	div.addEventListener("click", function(event) {
		bulk_submit_draw_feeds();
	});
	document.getElementById("bulk_submit_feed_list").appendChild(div);

	if (state.screen_name == "") {
		update_screen_name();
	}

	var feed_url = "http://www.mondoplayer.com/rss/" + state.screen_name.replace(/ /g, '_') + "_" + feeds[parseInt(state.services.list.fields[0].default_feed)].trim().replace(/ /g, '_') + ".rss";
	document.getElementById("bulk_submit_feed_url").innerHTML = "<a href='" + feed_url + "' target='_blank'>" + feed_url + "</a>";
}

function bulk_submit_draw_feeds() {
	document.getElementById("bulk_submit_add_new_feed_button").value = "Add";
	var feeds = state.services.list.fields[0].feeds.split("|");
	document.getElementById("bulk_submit_feed_entry").style.display = "none";
	document.getElementById("bulk_submit_feed_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_feed_list"));
	for (var i = 0; i < feeds.length; i++) {
		if (feeds[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");

		var feed_entry_select = document.createElement("div");
		feed_entry_select.classList.add("feed_entry_edit");
		feed_entry_select.innerHTML = "Select";
		feed_entry_select.setAttribute("feed", feeds[i].trim());
		feed_entry_select.addEventListener("click", function(event) {
			bulk_submit_select_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_select);

		var feed_entry_title = document.createElement("div");
		feed_entry_title.classList.add("feed_entry_title");
		feed_entry_title.innerHTML = feeds[i].trim();
		feed_entry_title.setAttribute("feed", feeds[i].trim());
		feed_entry_title.addEventListener("click", function(event) {
			bulk_submit_select_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_title);

		var feed_entry_delete = document.createElement("div");
		feed_entry_delete.classList.add("feed_entry_delete");
		feed_entry_delete.innerHTML = "-";
		feed_entry_delete.setAttribute("feed", feeds[i].trim());
		feed_entry_delete.addEventListener("click", function(event) {
			bulk_submit_delete_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_delete);

		var feed_entry_edit = document.createElement("div");
		feed_entry_edit.classList.add("feed_entry_edit");
		feed_entry_edit.innerHTML = "Edit";
		feed_entry_edit.setAttribute("feed", feeds[i].trim());
		feed_entry_edit.addEventListener("click", function(event) {
			bulk_submit_add_new_feed(event.target.getAttribute("feed"));
		});

		div.appendChild(feed_entry_edit);

		document.getElementById("bulk_submit_feed_list").appendChild(div);
	}
}

function bulk_submit_select_feed(feed) {
	document.getElementById("bulk_submit_add_new_feed_button").value = "Add";
	var feeds = state.services.list.fields[0].feeds.split("|");
	for (var i = 0; i < feeds.length; i++) {
		if (feeds[i] == feed) {
			state.services.list.fields[0].default_feed = i;
			break;
		}
	}
	bulk_submit_show_feed();
}

var cur_feed = "";
function bulk_submit_delete_feed(feed) {
	cur_feed = feed;
	show_confirm("Are you sure you want to delete the feed '" + feed + "'?", bulk_submit_confirm_delete_feed, "Ok"); 
}

function bulk_submit_confirm_delete_feed() {
	var feeds = state.services.list.fields[0].feeds.split("|");
	feeds.splice(feeds.indexOf(cur_feed), 1);
	state.services.list.fields[0].feeds = feeds.join("|");

	state.services.list.fields[0].default_feed = 0;

	for (var i = 0; i < feeds.length; i++) {
		if (feeds[i] == cur_feed) {
			state.services.list.fields[0].default_feed = i;
			break;
		}
	}

	save_fields();
	bulk_submit_draw_feeds();
	hide_message();
}

function bulk_submit_add_new_project(project) {
	if (document.getElementById("bulk_submit_add_new_project_button").value == "Add") {
		document.getElementById("bulk_submit_add_new_project_button").value = "Back";
	} else {
		document.getElementById("bulk_submit_add_new_project_button").value = "Add";
		bulk_submit_add_project();
		return;
	}
	document.getElementById("bulk_submit_project_title").value = project;
	document.getElementById("bulk_submit_project_entry").style.display = "block";
	document.getElementById("bulk_submit_project_list").style.display = "none";
	document.getElementById("bulk_submit_project_error").style.display = "none";
}

function bulk_submit_add_project() {
	var project = document.getElementById("bulk_submit_project_title").value.trim();
	if (project == "") {
		bulk_submit_show_project();
		return;
	}

	var projects = state.services.list.fields[0].projects.split("|");
	if (projects.indexOf(project) == -1) {
		projects.push(project);
		state.services.list.fields[0].projects = projects.join("|");
		state.services.list.fields[0].default_project = projects.length - 1;
	}

	save_fields();
	bulk_submit_select_project(project);
}

function bulk_submit_show_project() {
	document.getElementById("bulk_submit_add_new_project_button").value = "Add";
	if (state.services.list.fields[0].default_project == null) {
		bulk_submit_draw_projects();
		return;
	}
	if (state.services.list.fields[0].projects == "") {
		return;
	}

	var projects = state.services.list.fields[0].projects.split("|");
	document.getElementById("bulk_submit_project_entry").style.display = "none";
	document.getElementById("bulk_submit_project_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_project_list"));

	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.innerHTML = projects[parseInt(state.services.list.fields[0].default_project)] + " <div style='float:right'>&#9660;</div>";
	div.addEventListener("click", function(event) {
		bulk_submit_draw_projects();
	});
	document.getElementById("bulk_submit_project_list").appendChild(div);
}

function bulk_submit_draw_projects() {
	document.getElementById("bulk_submit_add_new_project_button").value = "Add";
	var projects = state.services.list.fields[0].projects.split("|");
	document.getElementById("bulk_submit_project_entry").style.display = "none";
	document.getElementById("bulk_submit_project_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_project_list"));
	for (var i = 0; i < projects.length; i++) {
		if (projects[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");

		var project_entry_select = document.createElement("div");
		project_entry_select.classList.add("feed_entry_edit");
		project_entry_select.innerHTML = "Select";
		project_entry_select.setAttribute("project", projects[i].trim());
		project_entry_select.addEventListener("click", function(event) {
			bulk_submit_select_project(event.target.getAttribute("project"));
		});
		div.appendChild(project_entry_select);

		var project_entry_title = document.createElement("div");
		project_entry_title.classList.add("feed_entry_title");
		project_entry_title.innerHTML = projects[i].trim();
		project_entry_title.setAttribute("project", projects[i].trim());
		project_entry_title.addEventListener("click", function(event) {
			bulk_submit_select_project(event.target.getAttribute("project"));
		});

		div.appendChild(project_entry_title);

		var project_entry_delete = document.createElement("div");
		project_entry_delete.classList.add("feed_entry_delete");
		project_entry_delete.innerHTML = "-";
		project_entry_delete.setAttribute("project", projects[i].trim());
		project_entry_delete.addEventListener("click", function(event) {
			bulk_submit_delete_project(event.target.getAttribute("project"));
		});

		div.appendChild(project_entry_delete);

		var project_entry_edit = document.createElement("div");
		project_entry_edit.classList.add("feed_entry_edit");
		project_entry_edit.innerHTML = "Edit";
		project_entry_edit.setAttribute("project", projects[i].trim());
		project_entry_edit.addEventListener("click", function(event) {
			bulk_submit_add_new_project(event.target.getAttribute("project"));
		});

		div.appendChild(project_entry_edit);

		document.getElementById("bulk_submit_project_list").appendChild(div);
	}
}

function bulk_submit_select_project(project) {
	var projects = state.services.list.fields[0].projects.split("|");
	document.getElementById("bulk_submit_project_error").style.display = "none";

	for (var i = 0; i < projects.length; i++) {
		if (projects[i] == project) {
			state.services.list.fields[0].default_project = i;
			break;
		}
	}
	bulk_submit_set_start_date();
	bulk_submit_show_project();
}

function bulk_submit_set_start_date() {
	var project_start_dates = state.services.list.fields[0].project_start_dates.split("|");
	var now_date = new Date();

	var cur_date = now_date;
	if (typeof project_start_dates[state.services.list.fields[0].default_project] !== "undefined") {
		var cur_start_date = project_start_dates[state.services.list.fields[0].default_project].replace(/ PM/, '').replace(/ AM/, '');
		if (cur_start_date.trim() != "") {
			cur_date = date_parse(cur_start_date);
		}
	}

	now_date.setHours(now_date.getHours() + 2);

	if (now_date > cur_date) {
		cur_date = now_date;
	}

	var cur_date_string = cur_date.toISOString().slice(0,10);
	document.getElementById("bulk_submit_schedule_date").value = cur_date_string;
	document.getElementById("bulk_submit_schedule_time").value = cur_date.getHours();
}

var cur_project = "";
function bulk_submit_delete_project(project) {
	cur_project = project;
	show_confirm("Are you sure you want to delete the project '" + project + "'?", bulk_submit_confirm_delete_project, "Ok"); 
	document.getElementById("bulk_submit_project_error").style.display = "none";
}

function bulk_submit_confirm_delete_project() {
	var projects = state.services.list.fields[0].projects.split("|");
	projects.splice(projects.indexOf(cur_project), 1);
	state.services.list.fields[0].projects = projects.join("|");

	state.services.list.fields[0].default_project = 0;

	for (var i = 0; i < projects.length; i++) {
		if (projects[i] == cur_project) {
			state.services.list.fields[0].default_project = i;
			break;
		}
	}

	save_fields();
	bulk_submit_draw_projects();
	hide_message();
}

function bulk_submit_open_create_category() {
	window.scrollTo(0,0);
	document.getElementById("bulk_submit_create_category_details").style.display = "block";
	document.getElementById("bulk_submit_page_form").style.display = "none";
}
function autopilot_open_create_category() {
	window.scrollTo(0,0);
	document.getElementById("autopilot_page_title").style.display = "none";
	document.getElementById("show_add_autopilot").style.display = "none";
	document.getElementById("new_autopilot_wrapper").style.display = "none";
	document.getElementById("mondoplayer_autopilot_table").style.display = "none";
	document.getElementById("autopilot_create_category_details").style.display = "block";
}

function bulk_submit_close_create_category() {
	window.scrollTo(0,0);
	document.getElementById("bulk_submit_create_category_details").style.display = "none";
	document.getElementById("bulk_submit_page_form").style.display = "block";
}

function autopilot_close_create_category() {
	window.scrollTo(0,0);
	document.getElementById("autopilot_page_title").style.display = "block";
	document.getElementById("show_add_autopilot").style.display = "block";
	document.getElementById("new_autopilot_wrapper").style.display = "block";
	document.getElementById("mondoplayer_autopilot_table").style.display = "none";
	document.getElementById("autopilot_create_category_details").style.display = "none";
	hide_message();
}

function save_search_open(source) {
	if (source) {
		var search_string = parse_easy_search(document.getElementById("easy_search_all").value, document.getElementById("easy_search_youtube").value, document.getElementById("easy_search_hash").value, document.getElementById("easy_search_phrase").value, document.getElementById("easy_search_any").value, document.getElementById("easy_search_none").value, document.querySelector('input[name="search_embed"]:checked').value);
		search_string.replace(/\|/g, "_");
		document.getElementById("search_entry").value = search_string;
	}
	draw_topics();
	document.getElementById("save_search_details").style.display = "block";
	document.getElementById("right_panel_search_page").style.display = "none";
	document.getElementById("right_panel_saved_searches").style.display = "none";
}

function close_save_search() {
	document.getElementById("save_search_details").style.display = "none";
	document.getElementById("right_panel_search_page").style.display = "block";
	document.getElementById("right_panel_saved_searches").style.display = "block";
}

function save_search(topic_id, topic_title) {
	if (document.getElementById("search_entry").value.trim() == "") {
		return;
	}
	if (topic_id > 0) {
		if (confirm("Are you sure you want to update the Saved Search '" + topic_title + "'?")) {
			cur_topic.alert_id = topic_id;
			cur_topic.alert_title = topic_title;
		} else {
			return;
		}
	} else {
		cur_topic.alert_id = 0;
		cur_topic.alert_title = document.getElementById("save_search_name").value.trim();
	}
	if (cur_topic.alert_title == "") {
		return;
	}

	cur_topic.search_terms = new Array();
	cur_topic.search_terms[0] = document.getElementById("search_entry").value.trim();

	var url = "https://www.mondoplayer.com/cgi-bin/search_notification.cgi";

	var requeststring = "id=" + license_key + "&alert=" + encodeURIComponent(JSON.stringify(cur_topic));

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	update_topics(true);
	dirty = false;

	save_state();

	clear_shake_error(document.getElementById("topic_form"));

	update_topics(true);
	draw_topics();
	close_save_search();
}

function bulk_submit_create_category() {
	if (document.getElementById("bulk_submit_create_category").value.trim() == "") {
		return;
	}
	var hide = 0;
	if (document.getElementById("bulk_submit_create_category_hide").checked) {
		hide = 1;
	}
	if (hide == 1) {
		show_message("IMPORTANT: Remember to add a Menu entry pointing to the Category, using the Appearances/Menu option in your Dashboard so users can see this section of your vlog.", true, 0, "block");
	}

	var requeststring = "action=mondoplayer&form=create_category&create_category=" + encodeURIComponent(document.getElementById("bulk_submit_create_category").value.trim()) + "&create_category_hide=" + hide;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", admin_post_url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	var retval = JSON.parse(xmlhttp.responseText);
	category_list = retval.categories;
	update_categories('bulk_submit');

	bulk_submit_close_create_category();
	for (var i = 0; i < category_list.length; i++) {
		if (category_list[i].name == document.getElementById("bulk_submit_create_category").value.trim()) {
			document.getElementById("bulk_submit_categories").value = category_list[i].term_id;
			bulk_submit_add_categories();
			break;
		}
	}
}

function autopilot_hide_in_main_blogroll_checked() {
	if (document.getElementById("autopilot_create_category_hide").checked) {
		document.getElementById("autopilot_create_category_hide_message").style.display = "list-item";
	} else {
		document.getElementById("autopilot_create_category_hide_message").style.display = "none";
	}
}

function autopilot_create_category() {
	if (document.getElementById("autopilot_create_category").value.trim() == "") {
		return;
	}

	if (document.getElementById("autopilot_create_category_hide").checked) {
		var popup_message = "<div style='text-align: left;font-size: 18px;margin-top: 8px'><b>Category set to Hide in Main Vlog Roll:</b> Posts will not display in your vlog unless you create a menu link to this Category.</div>";
		show_confirm(popup_message, autopilot_create_category_finish, "Ok");
	} else {
		autopilot_create_category_finish();
	}
}

function autopilot_create_category_finish() {
	hide_message();
	var hide = 0;
	if (document.getElementById("autopilot_create_category_hide").checked) {
		hide = 1;
	}

	var requeststring = "action=mondoplayer&form=create_category&create_category=" + encodeURIComponent(document.getElementById("autopilot_create_category").value.trim()) + "&create_category_hide=" + hide;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", admin_post_url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	var retval = JSON.parse(xmlhttp.responseText);
	category_list = retval.categories;
	update_categories('autopilot');

	autopilot_close_create_category();
	for (var i = 0; i < category_list.length; i++) {
		if (category_list[i].name == document.getElementById("autopilot_create_category").value.trim()) {
			document.getElementById("autopilot_categories").value = category_list[i].term_id;
			autopilot_add_categories();
			break;
		}
	}
}

function delete_category() {
	if (! confirm("You are about to permanently delete these items from your site.\nThis action cannot be undone.\n 'Cancel' to stop, 'OK' to delete.")) {
		return;
	}
	if (document.getElementById("new_category_id").value.trim() == 0) {
		return;
	}
	var requeststring = "action=mondoplayer&form=delete_category&delete_category=" + encodeURIComponent(document.getElementById("new_category_id").value.trim());
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", admin_post_url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	window.location = "admin.php?page=mondoplayer_menu_categories_slug";
}

var schedule_entry;
var schedule_entries;
var cur_schedule_entry = new Object();
function bulk_submit_add_new_schedule(entry) {
	//show_page("bulk_submit_edit_schedule");
	document.getElementById("bulk_submit_edit_schedule").style.display = "block";
	document.getElementById("bulk_submit_page_form").style.display = "none";

	var schedules = state.services.list.fields[0].schedules.split("|");

	if (entry == -1 || entry >= schedules.length ) {
		cur_schedule_entry.id = -1;
		cur_schedule_entry.title = "";
		cur_schedule_entry.schedules = { "days" : [{"hour": [], "minute":[]},{"hour": [], "minute":[]},{"hour": [], "minute":[]},{"hour": [], "minute":[]},{"hour": [], "minute":[]},{"hour": [], "minute":[]},{"hour": [], "minute":[]}] };
		schedule_entries = new Array();
	} else {
		cur_schedule_entry.id = entry;
		cur_schedule_entry.title = schedules[entry];
		schedule_entries = JSON.parse(state.services.list.fields[0].schedule_entries);

		cur_schedule_entry.schedules = schedule_entries[entry];
	}

	document.getElementById("bulk_submit_schedule_title").value = cur_schedule_entry.title;
	bulk_submit_draw_schedule_entries(entry);
}


function bulk_submit_draw_schedule_entries(entry) {
	remove_all_children(document.getElementById("bulk_submit_schedule_entries"));
	schedule_entry = entry;

	var report = "<table style='width:100%;background-color: white' cellpadding='0' cellspacing='0'>";

	for (var d = 0; d < cur_schedule_entry.schedules.days.length; d++) {
		if (cur_schedule_entry.schedules.days[d].hour.length > 0) {
			report = report + "<tr><td style='width: 75px'><div class='autopilot_email_schedule_day'>" + weekdays[d] + "</td><td><div style='padding-bottom: 12px'>";
			for (var h = 0; h < cur_schedule_entry.schedules.days[d].hour.length; h++) {
				var minute = cur_schedule_entry.schedules.days[d].minute[h] * 15;
				if (minute < 10) {
					minute = "0" + minute;
				}
				report = report + "<div class='tag tag_small tag_grey topic_button_selected' onclick='bulk_submit_remove_schedule_entry(" + entry + "," + d + "," + h + ")'>" +  cur_schedule_entry.schedules.days[d].hour[h] + ":" + minute + "</div>";
			}
		}
	}
	document.getElementById("bulk_submit_schedule_entries").innerHTML = report + "</div></td></tr></table>";
}

function bulk_submit_remove_schedule_entry(entry, day, hour) {
	cur_schedule_entry.schedules.days[day].hour.splice(hour, 1);
	cur_schedule_entry.schedules.days[day].minute.splice(hour, 1);

	bulk_submit_draw_schedule_entries(entry);
}

function bulk_submit_add_schedule_entry() {
	for (var i = 0; i < 7; i++) {
		if (document.getElementById("bulk_submit_email_schedule_day_" + i).checked) {
			if (cur_schedule_entry.schedules.days[i].hour.indexOf(document.getElementById("bulk_submit_schedule_hour").value) > -1 && cur_schedule_entry.schedules.days[i].minute.indexOf(document.getElementById("bulk_submit_schedule_minute").value) > -1) {
			} else {
				var day_entries = new Array();
				for (var item = 0; item < cur_schedule_entry.schedules.days[i].hour.length; item++) {
					var cur_entry = {"hour": cur_schedule_entry.schedules.days[i].hour[item], "minute": cur_schedule_entry.schedules.days[i].minute[item], "sort": (cur_schedule_entry.schedules.days[i].hour[item] * 100) + (cur_schedule_entry.schedules.days[i].minute[item] * 15)};
					day_entries.push(cur_entry);
				}
				day_entries.push({"hour": document.getElementById("bulk_submit_schedule_hour").value, "minute": document.getElementById("bulk_submit_schedule_minute").value, "sort": (document.getElementById("bulk_submit_schedule_hour").value * 100) + (document.getElementById("bulk_submit_schedule_minute").value * 15)});

				day_entries.sort(function(a, b) {
					if (a.sort > b.sort) {
						return 1;
					} else {
						return -1;
					}
				});

				cur_schedule_entry.schedules.days[i].hour = new Array();
				cur_schedule_entry.schedules.days[i].minute = new Array();

				for (var item = 0; item < day_entries.length; item++) {
					cur_schedule_entry.schedules.days[i].hour.push(day_entries[item].hour);
					cur_schedule_entry.schedules.days[i].minute.push(day_entries[item].minute);
				}
			}
		}
	}

	bulk_submit_draw_schedule_entries(schedule_entry);
}

function bulk_submit_save_schedule() {
	cur_schedule_entry.title = document.getElementById("bulk_submit_schedule_title").value.trim();
	if (cur_schedule_entry.title == "") {
		var element = document.getElementById("bulk_submit_schedule_title_error");
		element.style.display = "block";
		element.innerHTML = "You must enter a title for this schedule";
		shake_error(document.getElementById("bulk_submit_edit_schedule"));
		return;
	}

	var entry_count = 0;
	for (var d = 0; d < cur_schedule_entry.schedules.days.length; d++) {
		entry_count = entry_count + cur_schedule_entry.schedules.days[d].hour.length
	}

	if (entry_count == 0) {
		var element = document.getElementById("bulk_submit_schedule_entries_error");
		element.style.display = "block";
		element.innerHTML = "You must enter schedule post times for this schedule";
		shake_error(document.getElementById("bulk_submit_edit_schedule"));
		return;
	}

	var schedules = state.services.list.fields[0].schedules.split("|");

	if (state.services.list.fields[0].schedules == "") {
		schedules[0] = cur_schedule_entry.title;
		schedule_entries[0] = cur_schedule_entry.schedules;
		schedule_entry = 0;
	} else if (schedule_entry > -1) {
		schedules[schedule_entry] = cur_schedule_entry.title;
		schedule_entries[schedule_entry] = cur_schedule_entry.schedules;
	} else {
		schedules.push(cur_schedule_entry.title);
		schedule_entries.push(cur_schedule_entry.schedules);
		schedule_entry = schedules.length - 1;
	}

	state.services.list.fields[0].schedule_entries = JSON.stringify(schedule_entries);
	state.services.list.fields[0].default_schedule = schedule_entry;
	state.services.list.fields[0].schedules = schedules.join("|");

	console.log ("schedule_entry: " + schedule_entry);
	console.log ("schedules: " + state.services.list.fields[0].schedules);
	console.log ("default_schedule: " + state.services.list.fields[0].default_schedule);
	console.log ("schedule_entries: " + state.services.list.fields[0].schedule_entries);
	save_fields();

	clear_shake_error(document.getElementById("bulk_submit_edit_schedule"));

	bulk_submit_close_schedule()
}

function bulk_submit_close_schedule() {
	document.getElementById("bulk_submit_edit_schedule").style.display = "none";
	document.getElementById("bulk_submit_page_form").style.display = "block";
	bulk_submit_show_schedule();
}

function bulk_submit_show_schedule() {
	if (state.services.list.fields[0].default_schedule == null || state.services.list.fields[0].default_schedule < 0) {
		bulk_submit_draw_schedules();
		return;
	}
	if (state.services.list.fields[0].schedules == "") {
		return;
	}

	var schedules = state.services.list.fields[0].schedules.split("|");
	if (state.services.list.fields[0].default_schedule >= schedules.length) {
		state.services.list.fields[0].default_schedule = 0;
	}
	//document.getElementById("bulk_submit_schedule_entry").style.display = "none";
	document.getElementById("bulk_submit_schedule_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_schedule_list"));

	var div = document.createElement("div");
	div.classList.add("topic_keyword_entry");
	div.innerHTML = schedules[parseInt(state.services.list.fields[0].default_schedule)] + " <div style='float:right'>&#9660;</div>";
	div.addEventListener("click", function(event) {
		bulk_submit_draw_schedules();
	});
	document.getElementById("bulk_submit_schedule_list").appendChild(div);
}

function bulk_submit_draw_schedules() {
	var schedules = state.services.list.fields[0].schedules.split("|");
	//document.getElementById("bulk_submit_schedule_entry").style.display = "none";
	document.getElementById("bulk_submit_schedule_list").style.display = "block";
	remove_all_children(document.getElementById("bulk_submit_schedule_list"));
	for (var i = 0; i < schedules.length; i++) {
		if (schedules[i].trim() == "") {
			continue;
		}
		var div = document.createElement("div");
		div.classList.add("feed_entry");

		var schedule_entry_select = document.createElement("div");
		schedule_entry_select.classList.add("feed_entry_edit");
		schedule_entry_select.innerHTML = "Select";
		schedule_entry_select.setAttribute("schedule", i);
		schedule_entry_select.addEventListener("click", function(event) {
			bulk_submit_add_new_schedule(event.target.getAttribute("schedule"));
		});

		div.appendChild(schedule_entry_select);

		var schedule_entry_title = document.createElement("div");
		schedule_entry_title.classList.add("feed_entry_title");
		schedule_entry_title.innerHTML = schedules[i].trim();
		schedule_entry_title.setAttribute("schedule", schedules[i].trim());
		schedule_entry_title.addEventListener("click", function(event) {
			bulk_submit_select_schedule(event.target.getAttribute("schedule"));
		});

		div.appendChild(schedule_entry_title);

		var schedule_entry_delete = document.createElement("div");
		schedule_entry_delete.classList.add("feed_entry_delete");
		schedule_entry_delete.innerHTML = "-";
		schedule_entry_delete.setAttribute("schedule", schedules[i].trim());
		schedule_entry_delete.addEventListener("click", function(event) {
			bulk_submit_delete_schedule(event.target.getAttribute("schedule"));
		});

		div.appendChild(schedule_entry_delete);

		var schedule_entry_edit = document.createElement("div");
		schedule_entry_edit.classList.add("feed_entry_edit");
		schedule_entry_edit.innerHTML = "Edit";
		schedule_entry_edit.setAttribute("schedule", i);
		schedule_entry_edit.addEventListener("click", function(event) {
			bulk_submit_add_new_schedule(event.target.getAttribute("schedule"));
		});

		div.appendChild(schedule_entry_edit);

		document.getElementById("bulk_submit_schedule_list").appendChild(div);
	}
}

function bulk_submit_select_schedule(schedule) {
	var schedules = state.services.list.fields[0].schedules.split("|");
	for (var i = 0; i < schedules.length; i++) {
		if (schedules[i] == schedule) {
			state.services.list.fields[0].default_schedule = i;
			break;
		}
	}
	bulk_submit_show_schedule();
}

var cur_schedule = "";
function bulk_submit_delete_schedule(schedule) {
	cur_schedule = schedule;
	show_confirm("Are you sure you want to delete the schedule '" + schedule + "'?", bulk_submit_confirm_delete_schedule, "Ok"); 
}

function bulk_submit_confirm_delete_schedule() {
	var schedules = state.services.list.fields[0].schedules.split("|");
	schedules.splice(schedules.indexOf(cur_schedule), 1);
	state.services.list.fields[0].schedules = schedules.join("|");
	var cur_schedule_entries = JSON.parse(state.services.list.fields[0].schedule_entries);
	cur_schedule_entries.splice(schedules.indexOf(cur_schedule), 1);
	state.services.list.fields[0].schedule_entries = JSON.stringify(cur_schedule_entries);
	state.services.list.fields[0].default_schedule = 0;

	for (var i = 0; i < schedules.length; i++) {
		if (schedules[i] == cur_schedule) {
			state.services.list.fields[0].default_schedule = i;
			break;
		}
	}

	save_fields();
	bulk_submit_draw_schedules();
	hide_message();
}

function save_submit_fields() {
	var url = 'https://www.mondoplayer.com/cgi-bin/bulk_submit.cgi';
	var requeststring = "id=" + license_key + "&save_fields=" + encodeURIComponent(JSON.stringify(state.services.list.fields[0]))
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "403") {
		console.log("save_submit_fields: 403");
		log_back_in();
		return;
	}
	if (xmlhttp.responseText == "1") {
		console.log("save_submit_fields: 1");
		log_back_in();
		return;
	}
}

function send_posts() {
	//if (! state.isAccountSubscribed) {
	//	trial_expired();
	//	return;
	//}
	//if (! can_post) {
	//	show_message("You can only post one object per week with the Free version.  Please click 'Upgrade' to allow more posts.", true, 0, "block");
	//	return;
	//}

	var send = false;
	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			send = true;
			break;
		}
	}

	if (send == false) {
		show_message("You must approve posts to send", true, 0, "block");
		return;
	}

	if (state.services.list.fields[0].default_service == null || state.services.list.fields[0].default_service == 0) {
		var element = document.getElementById("bulk_submit_service_error");
		element.style.display = "block";
		element.innerHTML = "You must choose a service to continue";
		shake_error(document.getElementById("bulk_submit_page"));
		return;
	}

	var flags = 0;
	for  (var i = 0; i < state.services.list.services.length; i++) {
		if (state.services.list.fields[0].default_service == state.services.list.services[i].service_id) {
			flags = state.services.list.services[i].service_flags;
			break;
		}
	}

	if ((flags & 1) > 0 && state.services.list.fields[0].projects == "") {
		var element = document.getElementById("bulk_submit_project_error");
		element.style.display = "block";
		element.innerHTML = "You must enter a project title to continue";
		shake_error(document.getElementById("bulk_submit_page"));
		return;
	}

	if ((flags & 2) > 0 && state.services.list.fields[0].campaigns == "") {
		var element = document.getElementById("bulk_submit_campaign_error");
		element.style.display = "block";
		element.innerHTML = "You must enter a campaign title to continue";
		shake_error(document.getElementById("bulk_submit_page"));
		return;
	}

	if ((flags & 32) > 0 && state.services.list.fields[0].feeds == "") {
		var element = document.getElementById("bulk_submit_feed_title_error");
		element.style.display = "block";
		element.innerHTML = "You must enter a feed title to continue";
		shake_error(document.getElementById("bulk_submit_page"));
		return;
	}

	var fields_string = encodeURIComponent(JSON.stringify(state.services.list.fields[0]));

	if (((flags & 8) > 0 && (flags & 16) == 0 || ((flags & 16) > 0 && document.getElementById("bulk_submit_schedule_optional").checked)) && state.services.list.fields[0].schedules == "") {
		console.log("error: " + flags + " - " + document.getElementById("bulk_submit_schedule_optional").checked + " - " + state.services.list.fields[0].schedules);
		var element = document.getElementById("bulk_submit_schedule_error");
		element.style.display = "block";
		element.innerHTML = "You must enter a schedule to continue";
		shake_error(document.getElementById("bulk_submit_page"));
		return;
	}

	show_busy("Posting...");
	var mondoplayer_schedule = false;

	if (((flags & 8) > 0  && (flags & 16) == 0) || ((flags & 16) > 0 && document.getElementById("bulk_submit_schedule_optional").checked)) {
		mondoplayer_schedule = true;
	}

	state.search_results.sort(function(a, b) {
		if (a.order > b.order) {
			return -1;
		} else {
			return 1;
		}
	});

	save_hashtags();
	//document.getElementById("onlyPostVideosWithThumbnails").checked = document.getElementById("onlyPostVideosWithThumbnails_submit").checked;
	var only_thumbnails = 0;
	if (document.getElementById("onlyPostVideosWithThumbnails_submit").checked) {
		only_thumbnails = 1;
	}
	state.options.onlyPostVideosWithThumbnails = only_thumbnails;

	if (state.services.list.fields[0].default_service == 1) {
		send_buffer_posts();
		return;
	}
	if (state.services.list.fields[0].default_service == 11) {
		send_spredfast_posts();
		return;
	}

	var post_submission = new Object();
	post_submission.search_terms = document.getElementById("search_entry").value;
	post_submission.posts = new Array();
	post_submission.use_schedule = mondoplayer_schedule;

	if (mondoplayer_schedule) {
		get_first_schedule_entry();
		var cur_date_string = current_start_date.toISOString().slice(0,10);
		var date_options = { hour12: false };

		var cur_time_string = current_start_date.toLocaleTimeString('en-US');

		post_submission.start_date = cur_date_string + " " + cur_time_string
	}

	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			var cur_post = new Object();
			cur_post.media_id = state.search_results[i].media_id;
			cur_post.alert_id = state.search_results[i].alert_id;
			cur_post.message = state.search_results[i].title;
			cur_post.anchor = state.search_results[i].anchor;
			cur_post.thumbnail_url = state.search_results[i].thumbnail_url;
			cur_post.embedVideo = state.search_results[i].embedVideo;
			cur_post.url = state.search_results[i].url;
			cur_post.search_terms = state.search_results[i].search_terms;
			post_submission.posts.push(cur_post);
			if (mondoplayer_schedule) {
				get_next_schedule_entry();
			}
		}
	}

	var url = 'https://www.mondoplayer.com/cgi-bin/bulk_submit.cgi';
	var requeststring = "id=" + license_key + "&save_fields=" + fields_string + "&thumbnails=" + only_thumbnails + "&posts=" + encodeURIComponent(JSON.stringify(post_submission));

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			hide_busy();
			if (xmlhttp.responseText == "403") {
				console.log("send_posts: 403");
				log_back_in();
				return;
			}
			if (xmlhttp.responseText == "1") {
				console.log("send_posts: 1");
				log_back_in();
				return;
			}

			if (state.services.list.fields[0].default_service == 15) {
				create_wp_posts(post_submission);
				bulk_submit_delete_approved();
			} else {
				document.getElementById("bulk_submit_sent_title").innerHTML = xmlhttp.responseText;
				document.getElementById("bulk_submit_sent").style.display = "block";
				document.getElementById("bulk_submit_page").scrollTop = 0;
				document.getElementById("bulk_submit_page_form").style.display = "none"
			}
		}

	};

	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	clear_shake_error(document.getElementById("bulk_submit_page"));
}

var cancel_create_post_flag = false;
function cancel_create_wp_posts() {
	hide_busy();
	cancel_create_post_flag = true;
}

function create_wp_posts(post_submission) {
	if (post_submission.posts.length == 0 || cancel_create_post_flag) {
		hide_busy();
		cancel_create_post_flag = false;
		return;
	}
	var message = post_submission.posts[0].message.substr(0,40);
	if (post_submission.posts[0].message.length > 40) {
		message = message + "...";
	}
	status = "draft";
	if (document.getElementById('bulk_submit_status').value == 1) {
		status = "publish";
	}
	if (categories_split.length == 0) {
		bulk_submit_add_categories();
	}
	show_busy("Creating Post " + message + "<br /><input type='button' value='Cancel' onclick='cancel_create_wp_posts()' />");
	var payload = {'id':post_submission.posts[0].media_id,'url':post_submission.posts[0].url,'categories':categories_split,'title':post_submission.posts[0].message, 'status':status, 'thumbnail': document.getElementById("onlyPostVideosWithThumbnails_submit").checked, 'search_terms': post_submission.search_terms, 'user': document.getElementById("bulk_submit_users").value, 'hashtags': document.getElementById("bulk_submit_hashtags").value };

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			try {
				var response = JSON.parse(xmlhttp.responseText);
				if (response.message == "limit") {
					hide_busy();
					show_confirm("<p style='text-align: left;font-size: 24px'>You made one post this week.</p><p style='text-align: left;font-size: 24px'>To upgrade to MondoPlayer Pro, click Upgrade.</p>", show_upgrade, "Upgrade", false);
				} else if (response.message == "missing thumbnail") {
					hide_busy();
					show_message("Post did not contain a Thumbnail image. You selected \"Only Post Videos with Thumbnails\", so the post was not completed.", true, 0, "block");
					post_submission.posts.splice(0,1);
					if (post_submission.posts.length > 0) {
						create_wp_posts(post_submission);
					}
				} else if (response.message == null || response.message.substr(0,5) == "error") {
					hide_busy();
					show_message("There was an error creating this post.  Please try again later.", true, 0, "block");
					post_submission.posts.splice(0,1);
					if (post_submission.posts.length > 0) {
						create_wp_posts(post_submission);
					}
				} else if (response.message == "url") {
					hide_busy();
					show_message("This post was already created, skipping", true, 0, "block");
					post_submission.posts.splice(0,1);
					if (post_submission.posts.length > 0) {
						create_wp_posts(post_submission);
					}
				} else {
					post_submission.posts.splice(0,1);
					create_wp_posts(post_submission);
				}
			}
			catch(e) {
				hide_busy();
				show_message("There was an error creating this post.  Please try again later.", true, 0, "block");
				post_submission.posts.splice(0,1);
				if (post_submission.posts.length > 0) {
					create_wp_posts(post_submission);
				}
			}
		} else if (this.readyState == 4 && this.status != 200) {
			hide_busy();
			show_message("There was an error creating this post.  Please try again later.", true, 0, "block");
			post_submission.posts.splice(0,1);
			if (post_submission.posts.length > 0) {
				create_wp_posts(post_submission);
			}
		}
	};

	var requeststring = "action=mondoplayer&form=create_post&create_post=" + encodeURIComponent(JSON.stringify(payload));
	xmlhttp.open("POST", admin_post_url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);
}

function show_upgrade() {
	window.open('https://www.mondoplayer.com/upgrade/');
}

function save_hashtags() {
	var cur_hashtags = new Array();
	var default_hashtags = new Array();

	var hashtag_alert = 0;
	var default_hashtag_alert = 0;

	for (var i in state.topics.list) {
		if (! state.topics.list.hasOwnProperty(i)) {
			continue;
		}
		if (state.topics.list[i].adhoc == 1) {
			default_hashtag_alert = state.topics.list[i].alert_id;
			break;
		}
	}

	if (state.search_alert_id == 0) {
		hashtag_alert = default_hashtag_alert;
	} else {
		hashtag_alert = state.search_alert_id;
	} 

	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			var new_hashtags = state.search_results[i].title.match(/#\w+/g);

			if (new_hashtags != null) {
				for (var t = 0; t < new_hashtags.length; t++) {
					if (new_hashtags[t] == "") {
						continue;
					}
					if (cur_hashtags.indexOf(new_hashtags[t]) > -1) {

					} else {
						if (state.search_alert_id == 0) {
							default_hashtags.push(new_hashtags[t]);
						}
						cur_hashtags.push(new_hashtags[t]);
					}
				}
			}
		}
	}

	if (hashtag_alert == 0) {
		state.hashtags[hashtag_alert] = new Array();
	}

	for (var i = 0; i < state.hashtags[hashtag_alert].length; i++) {
		if (cur_hashtags.indexOf(state.hashtags[hashtag_alert][i]) > -1) {
		} else {
			cur_hashtags.push(state.hashtags[hashtag_alert][i]);
		}
	}

	for (var i = 0; i < state.hashtags[default_hashtag_alert].length; i++) {
		if (default_hashtags.indexOf(state.hashtags[default_hashtag_alert][i]) > -1) {
		} else {
			default_hashtags.push(state.hashtags[default_hashtag_alert][i]);
		}
	}

	state.hashtags[hashtag_alert] = cur_hashtags;
	state.hashtags[default_hashtag_alert] = default_hashtags;
	var hashtags_string = hashtag_alert;
	var default_hashtag_string = "";

	for (var i = 0; i < cur_hashtags.length; i++) {
		hashtags_string = hashtags_string + "|" + cur_hashtags[i];
	}

	for (var i = 0; i < default_hashtags.length; i++) {
		default_hashtag_string = default_hashtag_string + "|" + default_hashtags[i];
	}

	var url = 'https://www.mondoplayer.com/cgi-bin/search_notification.cgi';
	var requeststring = "id=" + license_key + "&default_hashtags=" + encodeURIComponent(default_hashtag_string) + "&hashtags_string=" + encodeURIComponent(hashtags_string);

	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	if (xmlhttp.responseText == "1") {
		return;
	} else if (xmlhttp.responseText == "403") {
		console.log("save_hashtags: 403");
		log_back_in();
		return;
	}

	update_topics(true);
}

function send_buffer_posts() {
	if (state.services.list.fields[0].buffer_profiles == null || state.services.list.fields[0].buffer_profiles.length == 0) {
		show_message("No Buffer profiles are selected", true, 0, "block");
		return;
	}

	var flags = 0;
	for  (var i = 0; i < state.services.list.services.length; i++) {
		if (state.services.list.services[i].service_id == 1) {
			flags = state.services.list.services[i].service_flags;
			break;
		}
	}

	var share_profiles = "";
	for (var i = 0; i < state.services.list.fields[0].buffer_profiles.length; i++) {
		share_profiles = share_profiles + "&profile_ids[]=" + state.services.list.fields[0].buffer_profiles[i];
	}

	var mondoplayer_schedule = false;
	if (((flags & 8) > 0  && (flags & 16) == 0) || ((flags & 16) > 0 && document.getElementById("bulk_submit_schedule_optional").checked)) {
		mondoplayer_schedule = true;
		get_first_schedule_entry();
	}
	var url = "https://www.mondoplayer.com/bufferapp.php?regKey=" + state.regKey;


	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			var requeststring = "access_token=" + buffer.buffer_key + "&text=" + encodeURIComponent(state.search_results[i].title.replace(/||/g, "-")) + share_profiles + "&media[link]=" + encodeURIComponent(state.search_results[i].url) + "&media[title]=Shared+via+MondoPlayer&media[description]=Shared+via+MondoPlayer";
			if (mondoplayer_schedule) {
				requeststring = requeststring + "&scheduled_at=" + current_start_date.toISOString();
				get_next_schedule_entry();
			}

			var xmlhttp = new XMLHttpRequest();	
			xmlhttp.open("POST", url, false);
			xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlhttp.setRequestHeader("Accept", "text/plain");
			xmlhttp.send("post=" + encodeURIComponent(requeststring));

			var error = JSON.parse(xmlhttp.responseText);
			if (error.success == false) {
				show_message("Buffer reports an error <br />'" + error.message + "'", true, 0, "block");
				return;
			}
		}
	}

	hide_busy();
	document.getElementById("bulk_submit_sent_title").innerHTML = "Your posts have been queued to Buffer";
	document.getElementById("bulk_submit_sent").style.display = "block";
	document.getElementById("bulk_submit_page").scrollTop = 0;
	document.getElementById("bulk_submit_page_form").style.display = "none"

	save_submit_fields();
}

function send_spredfast_posts() {
	if (typeof state.services.list.fields[0].spredfast_account === "undefined" || state.services.list.fields[0].spredfast_account === 0) {
		show_message("No Spredfast profiles are selected", true, 0, "block");
		return;

	}

	var flags = 0;
	for  (var i = 0; i < state.services.list.services.length; i++) {
		if (state.services.list.services[i].service_id == 11) {
			flags = state.services.list.services[i].service_flags;
			break;
		}
	}
	
	var spredfast_account;
	for (var i = 0; i < spredfast.accounts.length; i++ ) {
		if (spredfast.accounts[i]["id"] == state.services.list.fields[0].spredfast_account) {
			spredfast_account = spredfast.accounts[i];
			break;
		}
	}

	if (typeof spredfast_account === "undefined") {
		show_message("No Spredfast profiles are selected", true, 0, "block");
		return;
	}

	var mondoplayer_schedule = false;
	if (((flags & 8) > 0  && (flags & 16) == 0) || ((flags & 16) > 0 && document.getElementById("bulk_submit_schedule_optional").checked)) {
		mondoplayer_schedule = true;
		get_first_schedule_entry();
	}

	var p = "/" + spredfast_account.company_environment + "/v1/company/" + spredfast_account.company_id + "/initiative/" + spredfast_account.initiative_id + "/message";

	var url = "https://www.mondoplayer.com/spredfastapp.php?regKey=" + state.regKey;

	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			var requestobj = {"sfEntityType": "Message", "content": {"sfEntityType":"Status","text": state.search_results[i].title.replace(/||/g, "-") + " " + state.search_results[i].url },"service":  spredfast_account.service ,"targetAccountIds": [ parseInt(spredfast_account.id) ] };

			if (mondoplayer_schedule) {
				requestobj.scheduledPublishDate = current_start_date.toISOString()
				get_next_schedule_entry();
			}

			var xmlhttp = new XMLHttpRequest();	
			xmlhttp.open("POST", url, false);
			xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlhttp.setRequestHeader("Accept", "text/plain");
			xmlhttp.send("p=" + encodeURIComponent(p) + "&t=" + encodeURIComponent(spredfast.spredfast_key) +  "&post=" + encodeURIComponent(JSON.stringify(requestobj)));

			try {
				var error = JSON.parse(xmlhttp.responseText);
				if (typeof error.status === "undefined") {
					show_message("Spredfast reports an error <br />'" + error.message + "'", true, 0, "block");
					return;
				}
				if (error.status.succeeded == false) {
					show_message("Spredfast reports an error <br />'" + error.status.error.message + "'", true, 0, "block");
					return;
				}
			} 
			catch (e) {
				console.log(JSON.stringify(e));
				show_message("Spredfast reports an error <br />'" + xmlhttp.responseText + "'", true, 0, "block");
				return;
			}
		}
	}

	document.getElementById("bulk_submit_sent_title").innerHTML = "Your posts have been queued to Spredfast";
	document.getElementById("bulk_submit_sent").style.display = "block";
	document.getElementById("bulk_submit_page").scrollTop = 0;
	document.getElementById("bulk_submit_page_form").style.display = "none"

	save_submit_fields();
}


function bulk_submit_save_approved() {
	document.getElementById("bulk_submit_sent").style.display = "none";
	document.getElementById("bulk_submit_page_form").style.display = "block"
	save_state();
	//	show_page("search_page");
}

function bulk_submit_delete_approved() {
	for (var i = 0; i < state.search_results.length; i++) {
		if (state.search_results[i].approved) {
			state.search_results[i].approved_sent = true;
		}
		state.search_results[i].approved = false;
	}
	document.getElementById("bulk_submit_page_form").style.display = "block"
	document.getElementById("bulk_submit_sent").style.display = "none";
	document.getElementById('right_panel_search_page').style.display='block';
	document.getElementById('bulk_submit_page').style.display='none';

	save_state();
	//show_page("search_page");
	toggle_show_approved(true);
}

var current_start_date;
var sched = new Array();
function get_first_schedule_entry() {
	schedule_entries = JSON.parse(state.services.list.fields[0].schedule_entries);

	var cur_sched = schedule_entries[state.services.list.fields[0].default_schedule].days;
	sched = new Array();
	for (var d = 0; d < cur_sched.length; d++) {
		var sched_day = new Array();
		for (var h = 0; h < cur_sched[d].hour.length; h++) {
			var new_sched = (cur_sched[d].hour[h] * 100) + (cur_sched[d].minute[h] * 15);
			sched_day.push(new_sched);
		}
		sched.push(sched_day);
	}

	var project_start_dates = state.services.list.fields[0].project_start_dates.split("|");
	current_start_date = new Date(document.getElementById("bulk_submit_schedule_date").value + "T00:00:00.00");
	current_start_date.setHours(document.getElementById("bulk_submit_schedule_time").value);

	var cur_date_string = current_start_date.toISOString().slice(0,10);
	var cur_time_string = current_start_date.toLocaleTimeString('en-US');

	project_start_dates[parseInt(state.services.list.fields[0].default_project)] = cur_date_string + " " + cur_time_string;

	state.services.list.fields[0].project_start_dates = project_start_dates.join("|");

}

function get_next_schedule_entry() {
	var day = current_start_date.getDay();
	var time = (current_start_date.getHours() * 100) + current_start_date.getMinutes();
	var index = sched[day].indexOf(time);
	if (index == -1) {
		for (var i = 0; i < sched[day].length; i++) {
			if (sched[day][i] > time) {
				index = i;
				break;
			}
		}
	}
	if (index != -1 && index < sched[day].length - 1) {
		current_start_date.setHours(schedule_entries[state.services.list.fields[0].default_schedule].days[day].hour[index + 1]);
		current_start_date.setMinutes(schedule_entries[state.services.list.fields[0].default_schedule].days[day].minute[index + 1] * 15);
	} else {
		var days = 1;
		if (day == 6) {
			day = 0;
		} else {
			day++;
		}

		while (sched[day].length == 0) {
			if (day == 6) {
				day = 0;
			} else {
				day++;
			}
			days++;
		}

		current_start_date.setDate(current_start_date.getDate() + days);
		current_start_date.setHours(schedule_entries[state.services.list.fields[0].default_schedule].days[day].hour[0]);
		current_start_date.setMinutes(schedule_entries[state.services.list.fields[0].default_schedule].days[day].minute[0] * 15);
	}

	var project_start_dates = state.services.list.fields[0].project_start_dates.split("|");
	var cur_date_string = current_start_date.toISOString().slice(0,10);
	var cur_time_string = current_start_date.toLocaleTimeString('en-US');

	project_start_dates[parseInt(state.services.list.fields[0].default_project)] = cur_date_string + " " + cur_time_string;

	state.services.list.fields[0].project_start_dates = project_start_dates.join("|");

	console.log("get_next_schedule_entry: " + current_start_date);
}

function bulk_submit_select_service() {
	if (document.getElementById("bulk_submit_service").value > 0) {
		state.services.list.fields[0].default_service = document.getElementById("bulk_submit_service").value;
	}
	var flags = 0;
	for  (var i = 0; i <  state.services.list.services.length; i++) {
		if (state.services.list.fields[0].default_service == state.services.list.services[i].service_id) {
			flags = state.services.list.services[i].service_flags;
			break;
		}
	}

	var project_start_dates = state.services.list.fields[0].project_start_dates.split("|");

	if ((flags & 32) > 0) {
		document.getElementById("bulk_submit_rss_details").style.display = "block";
	} else {
		document.getElementById("bulk_submit_rss_details").style.display = "none";
	}

	if ((flags & 1) > 0) {
		document.getElementById("bulk_submit_project_details").style.display = "block";
	} else {
		document.getElementById("bulk_submit_project_details").style.display = "none";
	}

	if ((flags & 2) > 0) {
		document.getElementById("bulk_submit_campaign_details").style.display = "block";
	} else {
		document.getElementById("bulk_submit_campaign_details").style.display = "none";
	}

	if ((flags & 8) > 0) {
		document.getElementById("bulk_submit_schedule_details").style.display = "block";
	} else {
		document.getElementById("bulk_submit_schedule_details").style.display = "none";
	}
	if (state.services.list.fields[0].default_service == 15) {
		document.getElementById("bulk_submit_categories_details").style.display = "table";
		document.getElementById("bulk_submit_state_details").style.display = "table";
	} else {
		document.getElementById("bulk_submit_categories_details").style.display = "none";
		document.getElementById("bulk_submit_state_details").style.display = "none";
	}

	var default_show_optional = false;
	if ((flags & 16) > 0) {
		document.getElementById("bulk_submit_schedule_optional_wrapper").style.display = "block";
		if (project_start_dates.length > state.services.list.fields[0].default_project && state.services.list.fields[0].default_project >= 0 && project_start_dates[parseInt(state.services.list.fields[0].default_project)] != "") {
			default_show_optional = true;
		}

		if (default_show_optional && state.default_show_optional) {
			document.getElementById("bulk_submit_schedule_optional").checked = true;
			document.getElementById("bulk_submit_schedule_details").style.display = "block";
		} else {
			document.getElementById("bulk_submit_schedule_optional").checked = false;
			document.getElementById("bulk_submit_schedule_details").style.display = "none";
		}
	} else { 
		document.getElementById("bulk_submit_schedule_optional_wrapper").style.display = "none";
	}

	if (state.services.list.fields[0].default_service == "1" || state.services.list.fields[0].default_service == "11") {
		document.getElementById("bulk_submit_api_details").style.display = "block";
		if (state.services.list.fields[0].default_service == "1") {
			bulk_submit_draw_buffer_profiles();
		} else {
			bulk_submit_draw_spredfast_profiles();
		}
	} else { 
		document.getElementById("bulk_submit_api_details").style.display = "none";
	}
}

function bulk_submit_draw_buffer_profiles() {
	if (! update_buffer_profiles()) {
		return;
	}

	remove_all_children(document.getElementById("bulk_submit_api_service_picker"));
	for (var i = 0; i < buffer.profiles.length; i++) {

		var div = document.createElement("div");
		div.classList.add("buffer_profile");

		var checked = "";
		if (state.services.list.fields[0].buffer_profiles != null && state.services.list.fields[0].buffer_profiles.indexOf(buffer.profiles[i]["id"]) > -1) {
			checked = "checked";
		}

		var content = "<input type='checkbox' id='buffer_" + buffer.profiles[i]["id"] + "' " + checked + " onclick='bulk_submit_toggle_buffer_profile(\"" + buffer.profiles[i]["id"] + "\")' style='width: auto;height: 18px' /> " + buffer.profiles[i]["service_username"];

		if (buffer.profiles[i]["service"] == "twitter") {
			content = content + " <img src='" + image_url + "twitter_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "facebook") {
			content = content + " <img src='" + image_url + "facebook_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "google") {
			content = content + " <img src='" + image_url + "gplus_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "linkedin") {
			content = content + " <img src='" + image_url + "linkedin_profile.png' />";
		} else if (buffer.profiles[i]["service"] == "appdotnet") {
			content = content + " <img src='" + image_url + "appnet_profile.png' />";
		}

		div.innerHTML = content;

		document.getElementById("bulk_submit_api_service_picker").appendChild(div);
	}
}

function bulk_submit_toggle_buffer_profile(id) {
	if (state.services.list.fields[0].buffer_profiles == null) {
		state.services.list.fields[0].buffer_profiles = new Array();
	}
	if (document.getElementById("buffer_" + id).checked) {
		if (state.services.list.fields[0].buffer_profiles.indexOf(id) > -1) {

		} else {
			state.services.list.fields[0].buffer_profiles.push(id);
		}
	} else {
		if (state.services.list.fields[0].buffer_profiles.indexOf(id) > -1) {
			state.services.list.fields[0].buffer_profiles.splice(state.services.list.fields[0].buffer_profiles.indexOf(id), 1);
		} else {
		}
	}

}

function bulk_submit_draw_spredfast_profiles() {
	if (! update_spredfast_profiles()) {
		return;
	}

	remove_all_children(document.getElementById("bulk_submit_api_service_picker"));

	for (var i = 0; i < spredfast.accounts.length; i++ ) {
		var div = document.createElement("div");
		div.classList.add("buffer_profile");

		var checked = "";

		if (state.services.list.fields[0].spredfast_account != null && state.services.list.fields[0].spredfast_account == spredfast.accounts[i].id) {
			checked = "checked"
		}

		var content = "<input type='checkbox' id='spredfast_" + spredfast.accounts[i]["id"] + "' " + checked +" onclick='bulk_submit_toggle_spredfast_profile(" + spredfast.accounts[i]["id"] + ")' style='width: auto;height: 18px' /> " + spredfast.accounts[i]["name"];

		if (spredfast.accounts[i]["service"] == "TWITTER") {
			content = content + " <img src='" + image_url + "twitter_profile.png' />";
		} else if (spredfast.accounts[i]["service"] == "FACEBOOK") {
			content = content + " <img src='" + image_url + "facebook_profile.png' />";
		}

		div.innerHTML = content;

		document.getElementById("bulk_submit_api_service_picker").appendChild(div);
	}
}

function bulk_submit_toggle_spredfast_profile(id) {
	state.services.list.fields[0].spredfast_account = id;
	bulk_submit_draw_spredfast_profiles();
}

function close_suggestions() {
	state.show_suggestions = document.getElementById("show_suggestions").checked;
	save_state();
	document.getElementById("right_panel_suggestions").style.display = "none";
}
function close_learning() {
	if (document.getElementById("show_learning").checked) {
		if (typeof state.show_learning !== "undefined" && state.show_learning == 1) {
			state.show_learning = 2;
		} else {
			state.show_learning = 1;
		}
		if (document.getElementById("learning_complex").style.display == "block") {
			state.show_learning = 3;
		}
		save_state();
	}
	document.getElementById("right_panel_learning").style.display = "none";
	document.getElementById("right_panel_output").style.display = "block";
}

function open_easy_search(search_term) {
	state.easy_search = true;
	if (document.getElementById("right_panel_easy_search")) {
		document.getElementById("right_panel_easy_search").style.display = "block";
		document.getElementById("right_panel_search_entry").style.display = "none";
	}
	if (document.getElementById("search_easy_autopilot")) {
		document.getElementById("search_easy_autopilot").style.display = "block";
		document.getElementById("search_advanced_autopilot").style.display = "none";
	}

	if (document.getElementById("right_panel_suggestions")) {
		document.getElementById("right_panel_suggestions").style.display = "none";
	}
	parse_advanced_search(search_term);
	options_draw_excluded_domains();
}

function open_advanced_search(item) {
	state.easy_search = false;
	if (document.getElementById("right_panel_suggestions") && (typeof state.show_suggestions === "undefined" || state.show_suggestions == false)) {
		document.getElementById("right_panel_suggestions").style.display = "block";
	}

	search_string = parse_easy_search(document.getElementById("easy_search_all").value, document.getElementById("easy_search_youtube").value, document.getElementById("easy_search_hash").value, document.getElementById("easy_search_phrase").value, document.getElementById("easy_search_any").value, document.getElementById("easy_search_none").value, document.querySelector('input[name="search_embed"]:checked').value);

	document.getElementById("search_entry").value = search_string;

	if (document.getElementById("right_panel_easy_search")) {
		document.getElementById("right_panel_easy_search").style.display="none";
		document.getElementById("right_panel_search_entry").style.display="flex"
	}

	if (document.getElementById("search_easy_autopilot")) {
		document.getElementById("search_easy_autopilot").style.display="none";
		document.getElementById("search_advanced_autopilot").style.display="flex"
	}
}
function filter_popup_open() {
	document.getElementById("content_filter_popup").style.display = "block";
	if (state.options.content_filters == "") {
		state.options.content_filters = "00000";
	}
	if (state.options.content_filters.substr(0,1) == "1") {
		document.getElementById("content_filter_gore").checked = true;
	} else {
		document.getElementById("content_filter_gore").checked = false;
	}
	if (state.options.content_filters.substr(1,1) == "1") {
		document.getElementById("content_filter_profanity").checked = true;
	} else {
		document.getElementById("content_filter_profanity").checked = false;
	}
	if (state.options.content_filters.substr(2,1) == "1") {
		document.getElementById("content_filter_religion").checked = true;
	} else {
		document.getElementById("content_filter_religion").checked = false;
	}
	if (state.options.content_filters.substr(3,1) == "1") {
		document.getElementById("content_filter_sex").checked = true;
	} else {
		document.getElementById("content_filter_sex").checked = false;
	}
	if (state.options.content_filters.substr(4,1) == "1") {
		document.getElementById("content_filter_violence").checked = true;
	} else {
		document.getElementById("content_filter_violence").checked = false;
	}
}

function filter_popup_save() {
	document.getElementById("content_filter_popup").style.display = "none";
	save_options();
}

function filter_popup_close() {
	document.getElementById("content_filter_popup").style.display = "none";
}

function parse_easy_search(all, youtube, hash, phrase, any, none, embed) {
	var search_string = "";
	if (youtube.trim() != "") {
		if (youtube.trim().indexOf("youtube channel") == 0) {
		} else if (youtube.trim().indexOf("https://www.youtube.com/") == 0) {
			var channel_id = get_youtube_channel_id(youtube);
			if (channel_id != "") {
				youtube = "youtube channel " + channel_id;
			} else {
				return;
			}
		} else {
			show_url_alert();
			return "";
		}
		if (all.trim() != "") {
			all = youtube + " " + all;
		} else {
			all = youtube;
		}
	}
	if (all.trim() != "") {
		all.replace(/“/g, '"');
		all.replace(/”/g, '"');

		var easy_search_all = all.trim().match(/[^\s"]+|"[^"]+"/g);
		for (var i = 0; i < easy_search_all.length; i++) {
			if (easy_search_all[i].trim() == "") {
				continue;
			}
			if (search_string != "") {
				search_string = search_string + " ";
			}
			search_string = search_string + easy_search_all[i];
		}
	}
	if (hash.trim() != "") {
		hash.replace(/“/g, '"');
		hash.replace(/”/g, '"');

		var easy_search_hash = hash.trim().split(/(\s+)/);
		for (var i = 0; i < easy_search_hash.length; i++) {
			if (easy_search_hash[i].trim() == "") {
				continue;
			}
			if (search_string != "") {
				search_string = search_string + " ";
			}
			if (easy_search_hash[i].indexOf("-") == 0) {
				if (easy_search_hash[i].indexOf("#") == 1) {
				} else {
					easy_search_hash[i] = "-#" + easy_search_hash[i].substr(1);
				}

			} else {
				if (easy_search_hash[i].indexOf("#") != 0) {
					search_string = search_string + "#";
				}
			}
			search_string = search_string + easy_search_hash[i];
		}
	}
	if (phrase.trim() != "") {
		phrase.replace(/“/g, '"');
		phrase.replace(/”/g, '"');

		if (search_string != "") {
			search_string = search_string + " ";
		}
		if (phrase.trim().indexOf('"') > -1) {
			search_string = search_string + phrase.trim();
		} else {
			search_string = search_string + '"' + phrase.trim() + '"';
		}
	}
	if (any.trim() != "") {
		any.replace(/“/g, '"');
		any.replace(/”/g, '"');

		var easy_search_any = any.trim().match(/[^\s"]+|"[^"]+"/g);
		for (var i = 0; i < easy_search_any.length; i++) {
			if (easy_search_any[i].trim() == "") {
				continue;
			}
			if (search_string != "") {
				search_string = search_string + " ";
			}
			if (i > 0) {
				search_string = search_string + "OR ";
			}
			search_string = search_string + easy_search_any[i];
		}
	}

	if (none.trim() != "") {
		none.replace(/“/g, '"');
		none.replace(/”/g, '"');

		var easy_search_none = none.trim().match(/[^\s"]+|"[^"]+"/g);
		for (var i = 0; i < easy_search_none.length; i++) {
			if (easy_search_none[i].trim() == "") {
				continue;
			}
			if (easy_search_none[i].substr(0,1) == "-") {
				easy_search_none[i] = easy_search_none[i].substr(1);
			}
			if (search_string != "") {
				search_string = search_string + " ";
			}
			search_string = search_string + "-" + easy_search_none[i];

		}
	}
	console.log("search_string: " + search_string);
	if (embed.toString() == "1") {
		search_string = search_string + " &embed";
		document.getElementById("search_embed_" + 1).checked = true;
	} else if (embed.toString() == "2") {
		search_string = search_string + " &vlog";
		document.getElementById("search_embed_" + 2).checked = true;
	} else {
		document.getElementById("search_embed_0").checked = true;
	}
	if (document.getElementById("easy_search_all")) {
		//document.getElementById("easy_search_all").value = all;
		//document.getElementById("easy_search_hash").value = hash;
		//document.getElementById("easy_search_phrase").value = phrase;
		//document.getElementById("easy_search_any").value = any;
		//document.getElementById("easy_search_none").value = none;
	}
	return search_string;
}

function get_youtube_channel_id(youtube) {
	var requeststring = "action=mondoplayer&form=parse_youtube&youtube_url=" + encodeURIComponent(youtube.trim());
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", admin_post_url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);
	console.log("response: " + xmlhttp.responseText);
	var retval = JSON.parse(xmlhttp.responseText);
	if (retval.success == 1) {
		show_message("There was an error getting this Youtube URL - please try again");
		console.log(retval.errorMessage);
		return "";
	}
	return retval.channel_id;
}

function easy_search_search(perform_search) {
	options_add_exclude(document.getElementById('easy_search_options_domain').value);
	var search_string = parse_easy_search(document.getElementById("easy_search_all").value, document.getElementById("easy_search_youtube").value,document.getElementById("easy_search_hash").value, document.getElementById("easy_search_phrase").value, document.getElementById("easy_search_any").value, document.getElementById("easy_search_none").value, document.querySelector('input[name="search_embed"]:checked').value);

	if (search_string == "") {
		return;
	}
	search_string.replace(/\|/g, "_");

	if (document.getElementById("search_entry")) {
		document.getElementById("search_entry").value = search_string;
	}
	if (perform_search) {
		do_search(search_string);
	}
}

function log_back_in() {
	show_message("Your session has timed out, please sign in again", false, 5000, "block");
	setTimeout("show_page('login_page')", 5000);
}

function logout() {
	if (has_localstorage) {
		window.localStorage.removeItem("state");
	}
	reset_state();

	var url = "https://www.mondoplayer.com/cgi-bin/account.cgi";

	var requeststring = "id=" + license_key + "&logout=1";

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);

	var url = "https://www.mondoplayer.com/player/wp.php";

	var requeststring = "logout=1";

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, false);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "text/plain");
	xmlhttp.send(requeststring);


	show_page("login_page");
}

function reset_state() {
	state = new Object();
	state.version = version_id;
	state.isAccountSubscribed = false;
	state.regKey = "";
	state.isAccountTrial = 1;
	state.isLoggedIn = false;
	state.country = "US";
	state.screen_name = "";
	state.accounts = new Array();
	state.accounts_update = false;

	state.options = new Object();
	state.options.emailFlag = 0;
	state.options.playOnlyDuringWifi = 0;
	state.options.playDuringRoaming = 0;
	state.options.onlyPostVideosWithThumbnails = 0;
	state.options.ignore_original_tags = 0;
	state.options.notification = 0;
	state.options.date = 0;
	state.options.excluded_domains = "";
	state.options.content_filters = "";

	state.keywords = new Object();
	state.keywords.date = 0;
	state.keywords.list = new Array();

	state.related_streams = new Object();
	state.related_streams.date = 0;
	state.related_streams.list = new Array();
	state.autopilots = new Object();
	state.autopilots.date = 0;
	state.autopilots.list = new Array();
	state.topics = new Object();
	state.topics.date = 0;
	state.topics.list = new Array();
	state.favourites = new Object();
	state.favourites.date = 0;
	state.favourites.list = new Array();

	state.services = new Object();
	state.services.list = new Object();
	state.services.date = 0;

	state.search_id = 0;
	state.search_alert_id = 0;
	state.search_results = new Array();
	state.search_results_date = 0;
	state.search_term = "";
	state.default_show_optional = false;

	state.easy_search = true;
	state.hashtags = new Object();
	state.notifications = new Array();
	state.notifications_date = 0;
	state.notifications_recent = 0;
	state.notifications_show = 0;
}

function check_state() {
	if (typeof state.hashtags == "undefined") {
		state.hashtags = new Object();
		update_topics(true);
	}
}

function save_state() {
	if (has_localstorage) {
		window.localStorage.setItem("state", JSON.stringify(state));
	}
}

function toggle_left_panel() {
	if (document.getElementById("left_contents").classList.contains("left_panel_open")) {
		document.getElementById("left_contents").classList.remove("left_panel_open");
		document.getElementById("left_contents").style.width = "300px";
		document.getElementById("right_panel").style.marginLeft = "320px";
		document.getElementById("middle_panel_button").innerHTML = "&lt;";
		document.getElementById("middle_panel_button").style.marginLeft = "300px";
	} else {
		document.getElementById("left_contents").classList.add("left_panel_open");
		document.getElementById("left_contents").style.width = "0px";
		document.getElementById("right_panel").style.marginLeft = "20px";
		document.getElementById("middle_panel_button").innerHTML = "&gt;";
		document.getElementById("middle_panel_button").style.marginLeft = "0px";
	}
}
function show_url_alert() {
	show_message("<p style='text-align: left;font-size: 24px'>Error:  To search for a Youtube Channel, enter the URL for the channel or a video in that channel </p>", false, 0, "block");
}
var click_clears_overlay = false;
function show_message(message, clicktoclear = true, timeout = 0, show_ok = "block") {
	click_clears_overlay = clicktoclear;
	document.getElementById("mondotag_overlay").style.display = "block";
	document.getElementById("mondotag_message_box").innerHTML = message;
	document.getElementById("message_ok").style.display = show_ok;
	document.getElementById("message_confirm").style.display = "none";
	if (timeout > 0) {
		setTimeout("hide_message()", timeout);
	}
}

function show_confirm(message, ok_action, ok_message, hide_cancel, cancel_message) {
	click_clears_overlay = false;
	document.getElementById("mondotag_overlay").style.display = "block";
	document.getElementById("mondotag_message_box").innerHTML = message;
	document.getElementById("message_ok").style.display = "none";
	document.getElementById("message_confirm").style.display = "block";
	document.getElementById("message_confirm_ok").outerHTML = document.getElementById("message_confirm_ok").outerHTML;
	document.getElementById("message_confirm_ok").value = ok_message;
	document.getElementById("message_confirm_ok").addEventListener("click", ok_action);
	document.getElementById("message_confirm_pricing").style.display = "none";

	if (hide_cancel) {
		document.getElementById("message_confirm_cancel").style.display = "none";
	} else {
		document.getElementById("message_confirm_cancel").style.display = "inline-block";
	}
	if (cancel_message) {
		document.getElementById("message_confirm_cancel").value = cancel_message;
	} else {
		document.getElementById("message_confirm_cancel").value = "Cancel";
	}
}

function shake_error(shake_element) {
	shake_element.classList.remove("shake_animation");
	void shake_element.offsetWidth;
	shake_element.classList.add("shake_animation");
}

function clear_shake_error(shake_element) {
	return;
}

function overlay_click() {
	if (click_clears_overlay) {
		hide_message();
	}
}

function hide_message() {
	document.getElementById("mondotag_overlay").style.display = "none";
	hide_busy();
}

function remove_all_children(element) {
	while (element.hasChildNodes()) {
		element.removeChild(element.lastChild);
	}
}

function trial_expired() {
	document.getElementById("mondotag_overlay").style.display = "block";
	document.getElementById("message_ok").style.display = "none";
	document.getElementById("message_confirm").style.display = "block";
	document.getElementById("message_confirm_ok").outerHTML = document.getElementById("message_confirm_ok").outerHTML;
	document.getElementById("message_confirm_ok").value = "Return to MondoPlayer";
	document.getElementById("message_confirm_ok").addEventListener("click", hide_message);
	document.getElementById("message_confirm_cancel").style.display = "none";
	document.getElementById("message_confirm_pricing").style.display = "inline-block";
	document.getElementById("mondotag_message_box").innerHTML =  "<div class='slide_panel_text' style='font-size: xx-large;'>Your MondoPlayer Pro trial has Expired</div><div class='slide_panel_text' style='text-align: left;'>With MondoPlayer Pro you can: <ul><li>Bulk Submit video posts to Social Media Schedulers and RSS Feeds</li><li>Create AutoPilots that automatically post videos to your Vlog, Email Newsletter and Social Media Feeds</li><li>Set up topics, so you can search more efficiently</li></ul></div>";
}

function show_busy(message) {
	document.getElementById("busy_overlay").style.display = "block";
	document.getElementById("busy_text").innerHTML = message;
}

function hide_busy() {
	document.getElementById("busy_overlay").style.display = "none";
}

function date_parse(date_string) {
	var d = new Date(parseInt(date_string.slice(0,4)), parseInt(date_string.slice(4,6)) - 1, parseInt(date_string.slice(6,8)), parseInt(date_string.slice(8,10)), parseInt(date_string.slice(10,12)));

	return d;
}

function trim_domain(domain, include_path) {
	var regexp = /[\w\.-]+/gi;
	var matches = domain.match(regexp);
	var retval = "";
	for (var i = 0; i < matches.length; i++) {
		if (retval != "" && matches[i].length > 0 && include_path) {
			retval = retval + "/" + matches[i];
		} else if (matches[i].indexOf(".") > -1) {
			retval = matches[i];
		}
	}
	if (retval.substr(0,4) == "www.") {
		retval = retval.substr(4);
	}

	return retval;
}

function set_service_select(x) {
	var i, j, selElmnt, a, b, c;

	selElmnt = x.getElementsByTagName("select")[0];
	var divs = x.getElementsByTagName("div");
	for (var i = divs.length - 1; i >= 0; i--) {
		divs[i].parentNode.removeChild(divs[i]);
	}

	/*for each element, create a new DIV that will act as the selected item:*/
	a = document.createElement("DIV");
	a.setAttribute("class", "service_select_selected");
	if (typeof selElmnt.options[selElmnt.selectedIndex] === "undefined") {
		a.innerHTML = "Select a Service...";
	} else {
		a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
	}

	x.appendChild(a);
	/*for each element, create a new DIV that will contain the option list:*/
	b = document.createElement("DIV");
	b.setAttribute("class", "service_select_items service_select_hide");
	for (j = 1; j < selElmnt.length; j++) {
		/*for each option in the original select element,
		create a new DIV that will act as an option item:*/
		c = document.createElement("DIV");
		c.innerHTML = selElmnt.options[j].innerHTML;
		c.addEventListener("click", function(e) {
			/*when an item is clicked, update the original select box,
			and the selected item:*/
			var y, i, k, s, h;
			s = this.parentNode.parentNode.getElementsByTagName("select")[0];
			h = this.parentNode.previousSibling;
			for (i = 0; i < s.length; i++) {
				if (s.options[i].innerHTML == this.innerHTML) {
					s.selectedIndex = i;
					if (s.id == "autopilot_service") {
						autopilot_select_service();
					} else if (s.id == "bulk_submit_service") {
						bulk_submit_select_service();
					}
				h.innerHTML = this.innerHTML;
				y = this.parentNode.getElementsByClassName("same-as-selected");
				for (k = 0; k < y.length; k++) {
				  y[k].removeAttribute("class");
				}
				this.setAttribute("class", "same-as-selected");
				break;
			  }
			}
			h.click();
		});
		b.appendChild(c);
	  }
	  x.appendChild(b);
	  a.addEventListener("click", function(e) {
		  /*when the select box is clicked, close any other select boxes,
		  and open/close the current select box:*/
		  e.stopPropagation();
		  closeAllSelect(this);
		  this.nextSibling.classList.toggle("service_select_hide");
		  this.classList.toggle("select-arrow-active");
	  });
}
function closeAllSelect(elmnt) {
  /*a function that will close all select boxes in the document,
  except the current select box:*/
  var x, y, i, arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  for (i = 0; i < y.length; i++) {
    if (elmnt == y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < x.length; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("service_select_hide");
    }
  }
}
function validate_email(email) {
    var regex = /\S+@\S+\.\S+/;
    return regex.test(email);
}
function go_to_mastermind(mastermind_url) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				console.log("mastermind: " + xmlhttp.responseText);
				var retval = JSON.parse(xmlhttp.responseText);
				if (retval) {
					if (retval.error > 0) {
						console.log("Error: " + retval.error_message);
					} else if (retval.data.error > 0) {
						alert("Error: " + retval.data.error_message);
					} else {
						window.open(mastermind_url + "/?sid=" + retval.data.sid);
						//window.open();
					}
				} else {
					alert("There was an error setting up the MasterMind connection");
				}
			}
		}
	};

	var requeststring = "form=go_to_mastermind&action=mondoplayer&return_url=" + encodeURIComponent(window.location.href);
	xmlhttp.open("POST", admin_post_url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Accept", "application/json");
	xmlhttp.send(requeststring);
}
function add_help_links() {
	if (typeof is_turnkey != "undefined" && is_turnkey == true) {
		let ul =  document.getElementById("adminmenu");
		let li = document.createElement("li");
		li.id = "toplevel_page_mondoplayer_menu_help_slug";
		li.classList.add("wp-has-submenu", "wp-not-current-submenu", "menu-top", "toplevel_page_mondoplayer_menu_help_slug", "menu-top-last");
		li.addEventListener("click", function(e) {
			let menu_items = document.querySelectorAll(".menu-top");
			for (let i = 0; i < menu_items.length; i++) {
				menu_items[i].classList.remove("current");
			}
			this.classList.add("current");
			if (this.querySelector(".wp-submenu").style.display == "block") {
				this.querySelector(".wp-submenu").style.display = "none";
			} else {
				this.querySelector(".wp-submenu").style.display = "block";
			}
		});
		li.innerHTML = '<a class="wp-has-submenu wp-not-current-submenu menu-top toplevel_page_mondoplayer_menu_help_slug menu-top-last" aria-haspopup="true"><div class="wp-menu-arrow"><div></div></div><div class="wp-menu-image dashicons-before" aria-hidden="true"><br></div><div class="wp-menu-name">Help</div></a><ul class="wp-submenu wp-submenu-wrap" style="top: unset;bottom: -30px;display: none"><li class="wp-submenu-head" aria-hidden="true">Help</li><li class="wp-first-item"><a onclick="go_to_mastermind(\'https://vlog.mondoplayer.com/mastermind-directory/\')" class="wp-first-item">Mastermind</a></li><li><a href="admin.php?page=mondoplayer_menu_consultation_slug">Book a Call</a></li><li><a href="admin.php?page=mondoplayer_menu_tawk_slug">Talk To Us</a></li></ul>'
		ul.insertBefore(li, document.getElementById("collapse-menu"));
	}
	if (document.getElementById("mondoplayer_plugin_side_menu") != null) {
		let ul = document.getElementById("mondoplayer_plugin_side_menu").parentElement.parentElement.parentElement;
		let li = document.createElement("li");
		li.innerHTML = "<a href='#' onclick='go_to_mastermind(\"https://vlog.mondoplayer.com/mastermind-directory/\")'>Help</a>";
		ul.appendChild(li);
	}
}
/*if the user clicks anywhere outside the select box,
then close all select boxes:*/
document.addEventListener("click", closeAllSelect);
