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

class MondoPlayer_Posts {
	public $license_key;
	public $turnkey;

	function __construct() {
		global $wpdb;
		$this->license_key = get_option( 'mondoplayer_license_key' );
		$this->turnkey = get_option('mondoplayer_turnkey', 0);
	}

	function posts_page() {
		global $wpdb;
		add_filter('wpseo_enable_notification_post_trash', '__return_false');
		add_filter('wpseo_enable_notification_post_slug_change', '__return_false');
		$table_name = $wpdb->prefix . "mondoplayer_autopilot";

		$results = $wpdb->get_results("SELECT * from $table_name");
		$autopilot_list = array();
		$autopilot_list[0] = "n/a";
		foreach ($results as $row) {
			$autopilot_list[$row->autopilot_id] = $row->title;
		}

		$categories = get_categories( array(
			'hide_empty' => false,
		));
		$search_posts = "";
		$autopilot_filter = -1;
		$category_filter = -1;
		$orderby = "post_date";
		$order = "desc";
		$pagenum = 1;
		$posts_per_page = 20;
		if (isset($_GET["posts_per_page"])) {
			$posts_per_page = intval($_GET["posts_per_page"]);
		}
		if (isset($_GET["orderby"])) {
			$orderby = $_GET["orderby"];
			$order = $_GET["order"];
		};
		if (isset($_GET['pagenum'])) {
			$pagenum = $_GET['pagenum'];
		}
		if (isset($_GET['search_posts'])) {
			$search_posts = $_GET['search_posts'];
		}
		if (isset($_GET['autopilot_filter'])) {
			$autopilot_filter = $_GET['autopilot_filter'];
		}
		if (isset($_GET['category_filter'])) {
			$category_filter = $_GET['category_filter'];
		}
		$page = "admin.php?page=mondoplayer_menu_posts_slug";

		$fields = array(
			"post_title"		=> array("Title", "", true),
			"source_domain"		=> array("Source Domain", "200px", false),
			"autopilot"			=> array("AutoPilot", "100px", true),
			"search_terms"	 	=> array("Search Terms", "180px", true),
			"categories"		=> array("Categories", "200px", false),
			"user"				=> array("Author", "100px", true),
			"post_date" 		=> array("Date", "100px", true),
		);
		$menu_url = admin_url("post.php");

		$post_count = 0;
		if ($this->turnkey == 1) {
			$post_count_object = wp_count_posts();
			if ($post_count_object) {
				$post_count = $post_count_object->publish + $post_count_object->draft + $post_count_object->pending;
			}
		} else {
			$post_counts = $wpdb->get_results( "SELECT COUNT(*) as count FROM {$wpdb->prefix}postmeta WHERE meta_key = 'mondoplayer_object'", OBJECT );
			$post_count = $post_counts[0]->count;
		}
		$page_count = ceil($post_count/$posts_per_page);
?>
<script>
var license_key = "<?php echo addslashes($this->license_key) ?>";
var admin_post_url = '<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>';
function search_posts() {
	window.location = "<?php echo $page ?>&search_posts=" + document.getElementById("post-search-input").value + "&category_filter=" + document.getElementById("category_filter").value + "&autopilot_filter=" + document.getElementById("autopilot_filter").value + "&posts_per_page=" + document.getElementById("posts_per_page").value;
}
function bulk_action() {
	var selected = new Array();
	var inputs = document.getElementsByTagName("input");
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].type == "checkbox" && inputs[i].id.substring(0,9) == "cb-select" && inputs[i].checked && inputs[i].value > 0 ) {
			selected.push(parseInt(inputs[i].value));
		}
	}
	process_changes(selected, document.getElementById("bulk-action-selector-top").value);
}

function process_changes(selected, action) {
	show_busy("Processing...");
	console.log("selected: " + JSON.stringify(selected) + " - " + action);
	if (selected.length > 0 && action !=  "-1") {
		var requeststring = "action=mondoplayer&form=bulk_action&bulk_action=" + action + "&posts=" + JSON.stringify(selected);
		console.log("Request: " + requeststring);
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", admin_post_url, true);
		xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xmlhttp.send(requeststring);

		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				window.location.reload();
			}
		};
	}
	selected = new Array();
}
function publish(post_id) {
	selected = new Array();
	selected.push(post_id);
	process_changes(selected, 'publish');
}
function draft(post_id) {
	selected = new Array();
	selected.push(post_id);
	process_changes(selected, 'draft');
}
function trash(post_id) {
	selected = new Array();
	selected.push(post_id);
	process_changes(selected, 'trash');
}
var youtube_channels = new Object();
function define_youtube_channels() {
	for (var i = 0; i < state.autopilots.list.length; i++) {
		if (typeof state.autopilots.list[i].search_terms_title === "undefined" || state.autopilots.list[i].search_terms_title == null) {
			console.log("skipping autopilot: " + state.autopilots.list[i].title)
			return;
		}
		var cur_search_terms = state.autopilots.list[i].search_terms.split("|");
		var cur_search_terms_title = state.autopilots.list[i].search_terms_title.split("|");
		for (var s = 0; s < cur_search_terms.length; s++) {
			if (cur_search_terms[s].indexOf("youtube channel") == 0) {
				if (typeof youtube_channels[cur_search_terms_title[s]] == "undefined") {

					youtube_channels[cur_search_terms[s]] = "'" + decodeURI(cur_search_terms_title[s]) + "' on Youtube";
				}
			}
		}
	}

	var search_terms_tds = document.querySelectorAll("td[data-colname=search_terms]");
	for (var i = 0; i < search_terms_tds.length; i++) {
		if (typeof youtube_channels[search_terms_tds[i].innerHTML] != "undefined") {
			search_terms_tds[i].innerHTML = youtube_channels[search_terms_tds[i].innerHTML];
		}
	}
}
function duplicate(post_id) {
	show_busy("Processing...");
	console.log("duplicate: " + post_id);
	var requeststring = "action=mondoplayer&form=duplicate_post&post_id=" + post_id;
	console.log("Request: " + requeststring);
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", admin_post_url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.send(requeststring);

	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			window.location.reload();
		}
	};
	return false;
}
window.addEventListener("load", function (event) {
	define_youtube_channels();
});

</script>
<style>
div .form-field input[type=text], div .form-field textarea {
	width: 100%;
}
div .form-field {
	padding-bottom: 12px;
	padding-top: 12px;
	border-bottom: 2px solid #ccc;
}
div .category_flex {
	display: flex;
	flex-wrap: wrap;
	padding-bottom: 8px;
}
div .category_label {
	display: inline-block;
	width: 230px;
	flex-grow: 0;
	padding-top: 4px;
}
div .category_content {
	flex-grow: 1;
	flex-shrink: 1;
	display: flex;
	flex-wrap: wrap;
	flex-basis: 800px;
}
div .category_input {
	width: 100%;
	flex-grow: 0;
	margin-right: 12px;
}
div .category_description {
	flex-basis: 400px;
	flex-grow: 2;
	flex-shrink: 2;
	padding-top: 4px;
	font-size: 13px;
}
.yoast-alert {
	display: none;
}
.toggle_trusted_domain {
	font-size: 12px;
	margin: 0 auto;
}
.tablenav {
	margin-top: 0;
	height: initial;
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
select {
	border-width: 1px;
	border-style: solid;
	height: 24px;
}
</style>
	<div id="posts_page" style='margin-right: 8px'>
		<h1 style='display: inline-block'>Posts</h1> <input type='button' value="Add New" class="form_submit_btn_light" onclick='window.location="post-new.php"' style="display: block;margin: 0"/>

<?php
		$pagination_string = "";
		if ($page_count > 1) {
			$pagination_string = '<div class="tablenav"><div class="tablenav-top tablenav-pages"><span class="displaying-num">' . $post_count . ' items</span><span class="pagination-links">';
			if ($pagenum > 2) {
				$pagination_string .= "<a class='first-page' href='$page&amp;orderby=$orderby&posts_per_page=$posts_per_page&amp;order=$order&amp;pagenum=1'><span class='screen-reader-text'>First page</span><span class='' aria-hidden='true'>«</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>First page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>«</span>";
			}
			if ($pagenum > 1) {
				$pagination_string .= "<a class='prev-page' href='$page&amp;orderby=$orderby&posts_per_page=$posts_per_page&amp;order=$order&amp;pagenum=" . ($pagenum - 1) . "'><span class='screen-reader-text'>Previous page</span><span class='' aria-hidden='true'>‹</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>Previous page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>‹</span>";
			}
			$pagination_string .= "<span class='paging-input'><label for='current-page-selector' class='screen-reader-text'>Current Page</label><input class='current-page' id='current-page-selector' type='text' name='paged' value='$pagenum' size='1' aria-describedby='table-paging' style='height: 28px'> of <span class='total-pages'>$page_count</span></span>";
			if ($pagenum < $page_count) {
				$pagination_string .= "<a class='next-page' href='$page&amp;orderby=$orderby&posts_per_page=$posts_per_page&amp;order=$order&amp;pagenum=" . ($pagenum + 1) . "'><span class='screen-reader-text'>Next page</span><span class='' aria-hidden='true'>›</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>Next page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>›</span>";
			}
			if ($pagenum < $page_count - 1 ) {
				$pagination_string .= "<a class='last-page' href='$page&amp;orderby=$orderby&posts_per_page=$posts_per_page&amp;order=$order&amp;pagenum=$page_count'><span class='screen-reader-text'>Last page</span><span class='' aria-hidden='true'>»</span></a>";
			} else {
				$pagination_string .= "<span class='screen-reader-text'>Last page</span><span class='tablenav-pages-navspan button disabled' aria-hidden='true'>»</span>";
			}

			$pagination_string .= "</span></div></div>";
		}
?>
	<div>
	<p class="search-box">
		<label class="screen-reader-text" for="post-search-input">Search Posts:</label>
		<input type="search" id="post-search-input" name="s" style='width: 400px' value="<?php echo $search_posts ?>" />
		<input type="button" id="search-submit" class="button" value="Search Posts" onclick='search_posts()' />
	</p>
	</div>
	<div class='tablenav top' style='display: flex;flex-wrap: wrap;justify-content:space-between'>
		<div class="actions bulkactions" style='flex-basis: 300px'>
			<label for="bulk-action-selector-top" class="screen-reader-text">Select bulk action</label><select name="action" id="bulk-action-selector-top">
<option value="-1">Bulk Actions</option>
	<option value="trash">Move to Trash</option>
	<option value="publish" >Set to Publish</option>
	<option value="draft" >Set to Draft</option>
</select>
<input type="button" id="doaction" class="button action" value="Apply" onclick='bulk_action()'>
</div><div id="filters" class="actions" style="flex-grow: 1">
<label for="filter-selector-top" class="screen-reader-text">Filter Posts</label><select name="autopilot_filter" id="autopilot_filter" style="width: 200px"><option value="-1">All AutoPilots</option>
<?php
		foreach ($autopilot_list as $key => $value){
			$selected = "";
			if ($key == $autopilot_filter) {
				$selected = "selected";
			}
			echo "<option value='$key' $selected>$value</option>";
		}
?>
</select><select name="category_filter" id="category_filter" style="width: 200px"><option value="-1">All Categories</option>
<?php
		foreach ($categories as $category){
			$selected = "";
			if ($category->term_id == $category_filter) {
				$selected = "selected";
			}
			echo "<option value='$category->term_id' $selected>$category->name</option>";		}
?>
</select> Posts per Page: <input type='text' style='width: 50px' id='posts_per_page' value='<?php echo $posts_per_page; ?>' /> <input type="button" class="button" value="Filter" onclick="search_posts()" /></div><?php echo $pagination_string ?>
	</div>
		<table class="wp-list-table fixed widefat striped tags" id='mondoplayer_posts_table' style='margin-top: 8px'>
	<thead>
	<tr>
<td id="cb" class="manage-column column-cb check-column"><label class="screen-reader-text" for="cb-select-all-1">Select All</label><input id="cb-select-all-1" type="checkbox" ></td>
<?php
		foreach ($fields as $field => $field_array) {
			$width = "";
			if ($field_array[1] !== "") {
				$width ="style='width: $field_array[1]'";
			}
			$link = $field_array[0];

			if ($field_array[2]) {
				$next_order = "asc";
				if ($field == $orderby && $order == "asc") {
					$next_order = "desc";
				}
				$link = "<a href='$page&amp;orderby=$field&posts_per_page=$posts_per_page&amp;order=$next_order'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a>";
			}
			if ($field == $orderby) {
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sorted $order' $width>$link</th>";
			} else {
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sortable desc' $width>$link</th>";
			}
		}
		echo "<th scope='col' id='trusted' class='manage-column column-name column-primary trusted-column' style='display: none;width: 100px'><b>Trusted Source</b></th>";

?>
</tr>
	</thead>
	<tbody id="the-list" data-wp-lists="list:tag">
<?php


$order_field = "{$wpdb->prefix}posts.post_date";
if ($orderby == "source_domain") {
	$order_field = "(SELECT {$wpdb->prefix}postmeta.meta_value FROM {$wpdb->prefix}postmeta WHERE {$wpdb->prefix}postmeta.post_id = {$wpdb->prefix}posts.ID AND {$wpdb->prefix}postmeta.meta_key = 'mondoplayer_origional_url') ";
} else if ($orderby == "autopilot") {
	$order_field = "(SELECT {$wpdb->prefix}postmeta.meta_value FROM {$wpdb->prefix}postmeta WHERE {$wpdb->prefix}postmeta.post_id = {$wpdb->prefix}posts.ID AND {$wpdb->prefix}postmeta.meta_key = 'mondoplayer_autopilot_id') ";
} else if ($orderby == "search_terms") {
	$order_field = "(SELECT {$wpdb->prefix}postmeta.meta_value FROM {$wpdb->prefix}postmeta WHERE {$wpdb->prefix}postmeta.post_id = {$wpdb->prefix}posts.ID AND {$wpdb->prefix}postmeta.meta_key = 'mondoplayer_search_terms') ";
} else if ($orderby == "categories") {
} else if ($orderby == "user") {
	$order_field = "{$wpdb->prefix}posts.post_author";
} else if ($orderby == "post_title") {
	$order_field = "{$wpdb->prefix}posts.post_title";
}

$sql = "SELECT DISTINCT {$wpdb->prefix}posts.ID as ID, $order_field AS order_field FROM {$wpdb->prefix}posts, {$wpdb->prefix}postmeta, {$wpdb->prefix}term_relationships WHERE {$wpdb->prefix}posts.ID = {$wpdb->prefix}postmeta.post_id AND {$wpdb->prefix}posts.ID = {$wpdb->prefix}term_relationships.object_id AND {$wpdb->prefix}posts.post_type='post' ";

if ($search_posts != "") {
	$sql .= " AND ({$wpdb->prefix}posts.post_title LIKE '%" . esc_sql($search_posts) . "%' OR  {$wpdb->prefix}posts.post_excerpt LIKE '%" . esc_sql($search_posts) . "%' OR ({$wpdb->prefix}postmeta.meta_key = 'mondoplayer_origional_url' AND {$wpdb->prefix}postmeta.meta_value LIKE '%" . esc_sql($search_posts) . "%') OR ({$wpdb->prefix}postmeta.meta_key = 'mondoplayer_search_terms' AND {$wpdb->prefix}postmeta.meta_value LIKE '%" . esc_sql($search_posts) . "%'))";
}
if ($category_filter > 0) {
	$sql .= " AND {$wpdb->prefix}term_relationships.term_taxonomy_id = $category_filter";
}
if ($autopilot_filter > 0) {
	$sql .= " AND (SELECT {$wpdb->prefix}postmeta.post_id FROM {$wpdb->prefix}postmeta WHERE  {$wpdb->prefix}postmeta.post_id = {$wpdb->prefix}posts.ID AND {$wpdb->prefix}postmeta.meta_key = 'mondoplayer_autopilot_id' AND {$wpdb->prefix}postmeta.meta_value = $autopilot_filter) IS NOT NULL";
}
$page_start = ($pagenum - 1) * $posts_per_page;

$sql .= " ORDER BY order_field " . esc_sql($order) . " LIMIT $page_start, $posts_per_page";

$posts = $wpdb->get_results($sql);

foreach ( $posts as $temp) {
	$post = get_post($temp->ID);
	$class = "";
	$post_meta = get_post_meta($post->ID, '', true);
	if (! isset($post_meta['mondoplayer_autopilot_id'][0]) || !isset($autopilot_list[$post_meta['mondoplayer_autopilot_id'][0]])) {
		$post->autopilot = "n/a";
	} else {
		$post->autopilot = $autopilot_list[$post_meta['mondoplayer_autopilot_id'][0]];
	}
	$post->categories = "";
	$post->trusted = false;
	$post_categories = wp_get_object_terms($post->ID, 'category');
	foreach ( $post_categories as $category ) {
		$category_meta = get_term_meta($category->term_id, '', true);

		if (isset($category_meta['mondoplayer_pending'][0]) && $category_meta['mondoplayer_pending'][0] == 2) {
			$post->trusted = true;
		}
		if ($post->categories != "") {
			$post->categories .= ", ";
		}
		$post->categories .= $category->name;
	}
	$user = get_userdata($post->post_author);
	if (isset($user->user_nicename)) {
		$post->user = $user->user_nicename;
	} else {
		$post->user = $user->user_login;
	}
	$post->source_domain = "--";
	if (isset($post_meta['mondoplayer_origional_url'])) {
		$post->source_domain = parse_url($post_meta['mondoplayer_origional_url'][0], PHP_URL_HOST);
	}
	$post->search_terms = "";
	if (isset($post_meta['mondoplayer_search_terms'][0])) {
		$post->search_terms = str_replace("&vlog", "", $post_meta['mondoplayer_search_terms'][0]);
		$post->search_terms = str_replace("&embed", "", $post->search_terms);
	} else {
		#$post->autopilot = "";
		#$post->source_domain = "";
	}

?>
<tr id='tag-<?php echo $post->ID ?>' style='display: table-row;'>
	<th scope="row" class="check-column">
		<label class="screen-reader-text" for="cb-select-192">Select <?php echo $post->post_title ?></label>
		<input id="cb-select-<?php echo $post->ID ?>" type="checkbox" name="post[]" value="<?php echo $post->ID ?>">
		<div class="locked-indicator">
			<span class="locked-indicator-icon" aria-hidden="true"></span>
			<span class="screen-reader-text">“<?php echo $post->post_title ?>” is locked</span>
		</div>
	</th>
<?php
	$post->post_date = human_time_diff(get_the_time('U',$post->ID),current_time('U'));

	foreach ($fields as $field => $field_array) {
		$class = "";
		if ($field == "post_title") {
			$class = "column-primary";
			echo "<td class='$class' data-colname='$field'><a href='post.php?post=" . $post->ID . "&action=edit'>" . $post->post_title . "</a>";
			if ($post->post_status != "publish") {
				echo "<b> — " . ucwords($post->post_status) . "</b>";
			}
			echo "<div class='row-actions'><a href='post.php?post=" . $post->ID . "&action=edit'>Edit</a>";
			if ($this->turnkey == 1) {
				echo "&nbsp|&nbsp;<a href='#' onclick='duplicate(" . $post->ID . ")' >Duplicate</a>";
			}
			if ($post->post_status != "publish") {
				echo "&nbsp;|&nbsp;<a class='submitdelete' href='#' onclick='publish(" . $post->ID . ")'>Publish</a>";
			} else {
				echo "&nbsp;|&nbsp;<a class='submitdelete' href='#' onclick='draft(" . $post->ID . ")'>Draft</a>";
			}
			echo "&nbsp;|&nbsp;<a class='submitdelete' href='#' onclick='trash(" . $post->ID . ")' style='color: red'>Delete</a>&nbsp;|&nbsp;<a href='" . get_permalink($post->ID) . "' target='_blank'>Preview</a></div></td>";
		} else {
			$cur_entry = $post->{$field};
			if (strlen($cur_entry) > 128) {
				$cur_entry = substr($post->{$field}, 0, 128) . "...";
			}
			echo "<td class='$class' data-colname='$field'>" . $cur_entry . "</td>";
		}
	}
	if ($post->trusted == true) {
		$cur_search_terms = str_replace('"', '', $post->search_terms);
		echo "<td class='$class trusted-column' data-colname='trusted' style='display: none'>
			<div class='toggle_outside toggle_trusted_domain' domain='" . $post->source_domain . "' search_terms='" . $cur_search_terms . "' onclick='toggle_trusted_domain(\"" . $post->source_domain . "\", \"" . $cur_search_terms . "\")' style='display: none'><div class='toggle_inside' style='left: 18px; background-color: #777;'></div></div>
		</td>";
	} else {
		echo "<td class='$class trusted-column' data-colname='$field' style='display: none'></td>";
	}
	echo "</tr>";

}
?></tbody>
	<tfoot>
	<tr>
<td id="cb" class="manage-column column-cb check-column"><label class="screen-reader-text" for="cb-select-all-2">Select All</label><input id="cb-select-all-2" type="checkbox" ></td>

<?php 
		foreach ($fields as $field => $field_array) {
			$width = "";
			if ($field_array[1] !== "") {
				$width ="style='width: $field_array[1]'";
			}
			$link = $field_array[0];

			if ($field_array[2]) {
				$next_order = "asc";
				if ($field == $orderby && $order == "asc") {
					$next_order = "desc";
				}
				$link = "<a href='$page&amp;orderby=$field&posts_per_page=$posts_per_page&amp;order=$next_order'><span>" . $field_array[0] . "</span><span class='sorting-indicator'></span></a>";
			}
			if ($field == $orderby) {
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sorted $order' $width>$link</th>";
			} else {
				echo "<th scope='col' id='$field' class='manage-column column-name column-primary sortable desc' $width>$link</th>";
			}
		}
		echo "<th scope='col' id='trusted' class='manage-column column-name column-primary trusted-column' style='display: none;width: 100px' ><b>Trusted Source</b></th>";

?>
</tr>
	</tfoot>

</table>
<?php echo $pagination_string ?>
<p><?php
	#$posts = new WP_Query($posts_array);
	#echo "Last SQL-Query: $posts->request";
?></p>


	</div>
<?php
	}
}

