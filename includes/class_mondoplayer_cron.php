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

class MondoPlayer_Cron {

	function __construct(){
	}
	function run_autopilots() {
		require_once(plugin_dir_path(__FILE__).'/class_mondoplayer_autopilot.php');
		$mondoplayer_autopilot = new MondoPlayer_Autopilot();
		$mondoplayer_autopilot->sync_autopilots();
		$mondoplayer_autopilot->run_autopilots();
	}
	function finish_pending_posts() {
		require_once(plugin_dir_path(__FILE__).'/class_mondoplayer_autopilot.php');
		require_once(plugin_dir_path(__FILE__).'/class_mondoplayer_post.php');
		$mondoplayer_autopilot = new MondoPlayer_Autopilot();
		$mondoplayer_autopilot->sync_autopilots();

		$mondoplayer_post = new MondoPlayer_Post();
		$mondoplayer_post->finish_pending_posts();
	}

	function run_delete() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mondoplayer_deleted_posts';

		$default_days = get_option('mondoplayer_delete_age', 30);
		#error_log("default_days: $default_days");
		$categories = get_categories( array(
			'orderby' => 'date',
			'order' => 'asc',
			'hide_empty' => false,
		));
		for ($i = 0; $i < count($categories);$i++) {
			$min_days = $default_days;
			$category_meta = get_term_meta($categories[$i]->term_id, '', true);
			if (isset($category_meta['mondoplayer_delete_age'][0]) && $category_meta['mondoplayer_delete_age'][0] > 0) {
				$categories[$i]->days = $category_meta['mondoplayer_delete_age'][0];
				#error_log("category " . $categories[$i]->term_id . " days = " . $category_meta['mondoplayer_delete_age'][0]);
				if ($category_meta['mondoplayer_delete_age'][0] < $min_days) {
					$min_days = $category_meta['mondoplayer_delete_age'][0];
				}
				$min_date = date('Y-m-d', strtotime("-$min_days days"));
				#error_log("min_date: $min_date");
				$posts_array = array(
					'cat' => $categories[$i]->term_id,
					'post_type' => 'post',
					'meta_key' => 'mondoplayer_object',
					'no_found_rows' => true,
					'posts_per_page' => 1000,
					'date_query' => array(
						'before' => $min_date,
					)
				);
				$query = new WP_Query($posts_array);
				//$post_query = $query->posts;

				foreach ($query->posts as $cur_query) {
					if (get_post_meta($cur_query->ID, 'mondoplayer_pin_blog', true) > 1 || get_post_meta($cur_query->ID, 'mondoplayer_pin_slider', true) > 1) {
						continue;
					}
					foreach ($attachments as $attachment) {
						wp_delete_attachment( $attachment->ID, 'true' );
					}
					if (strtotime($cur_query->post_date) < strtotime("-" . $min_days . " days" )) {
						$attachments = get_attached_media('', $cur_query->ID);
						foreach ($attachments as $attachment) {
							wp_delete_attachment( $attachment->ID, 'true' );
						}
						if ($cur_query->post_name != "") {
							$wpdb->insert($table_name, array('url' => $cur_query->post_name, 'category' => get_category_link($categories[$i]->term_id)));
						}
						wp_delete_post($cur_query->ID, true);
					}
				}
			}
		}
	}
}
