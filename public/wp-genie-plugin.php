<?php
/**
 * Plugin Name: WP Genie Connector
 * Plugin URI: https://wpgenie.com
 * Description: Connect your WordPress site to WP Genie for automated content management and AI-powered posting.
 * Version: 1.0.0
 * Author: WP Genie
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WP_GENIE_VERSION', '1.0.0');
define('WP_GENIE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WP_GENIE_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('WP_GENIE_API_URL', 'https://517991bb-25dc-45db-824b-1084a92f11fe.sandbox.lovable.dev');

class WPGenieConnector {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('rest_api_init', array($this, 'register_api_routes'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Initialize plugin
    }
    
    public function activate() {
        // Generate API key for this site
        $api_key = wp_generate_password(32, false);
        update_option('wp_genie_api_key', $api_key);
        update_option('wp_genie_connected', false);
        
        // Create necessary database tables if needed
        $this->create_tables();
    }
    
    public function deactivate() {
        // Cleanup on deactivation
        delete_option('wp_genie_api_key');
        delete_option('wp_genie_connected');
        delete_option('wp_genie_user_token');
    }
    
    public function add_admin_menu() {
        add_options_page(
            'WP Genie Settings',
            'WP Genie',
            'manage_options',
            'wp-genie-settings',
            array($this, 'admin_page')
        );
    }
    
    public function admin_init() {
        register_setting('wp_genie_settings', 'wp_genie_user_token');
        register_setting('wp_genie_settings', 'wp_genie_connected');
    }
    
    public function admin_page() {
        $api_key = get_option('wp_genie_api_key');
        $connected = get_option('wp_genie_connected', false);
        $user_token = get_option('wp_genie_user_token', '');
        ?>
        <div class="wrap">
            <h1>WP Genie Connector</h1>
            
            <?php if ($connected): ?>
                <div class="notice notice-success">
                    <p><strong>✅ Connected to WP Genie!</strong></p>
                </div>
            <?php else: ?>
                <div class="notice notice-warning">
                    <p><strong>⚠️ Not connected to WP Genie</strong></p>
                </div>
            <?php endif; ?>
            
            <form method="post" action="options.php">
                <?php settings_fields('wp_genie_settings'); ?>
                <?php do_settings_sections('wp_genie_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">Site API Key</th>
                        <td>
                            <input type="text" value="<?php echo esc_attr($api_key); ?>" readonly class="regular-text" />
                            <p class="description">Copy this key to connect your site in the WP Genie dashboard.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">User Token</th>
                        <td>
                            <input type="text" name="wp_genie_user_token" value="<?php echo esc_attr($user_token); ?>" class="regular-text" />
                            <p class="description">Enter your WP Genie user token from your dashboard.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Connection Status</th>
                        <td>
                            <button type="button" id="test-connection" class="button">Test Connection</button>
                            <span id="connection-status"></span>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <h2>Site Information</h2>
            <table class="form-table">
                <tr>
                    <th>Site URL</th>
                    <td><?php echo esc_url(home_url()); ?></td>
                </tr>
                <tr>
                    <th>REST API Endpoint</th>
                    <td><?php echo esc_url(home_url('/wp-json/wp-genie/v1/')); ?></td>
                </tr>
                <tr>
                    <th>Plugin Version</th>
                    <td><?php echo WP_GENIE_VERSION; ?></td>
                </tr>
            </table>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#test-connection').click(function() {
                var button = $(this);
                var status = $('#connection-status');
                
                button.prop('disabled', true).text('Testing...');
                status.html('<span style="color: orange;">Testing connection...</span>');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'wp_genie_test_connection',
                        nonce: '<?php echo wp_create_nonce('wp_genie_test'); ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            status.html('<span style="color: green;">✅ Connected successfully!</span>');
                            // Update connection status
                            $.post(ajaxurl, {
                                action: 'wp_genie_update_status',
                                connected: true,
                                nonce: '<?php echo wp_create_nonce('wp_genie_update'); ?>'
                            });
                        } else {
                            status.html('<span style="color: red;">❌ Connection failed: ' + response.data + '</span>');
                        }
                    },
                    error: function() {
                        status.html('<span style="color: red;">❌ Connection failed</span>');
                    },
                    complete: function() {
                        button.prop('disabled', false).text('Test Connection');
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    public function register_api_routes() {
        register_rest_route('wp-genie/v1', '/posts', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_post'),
            'permission_callback' => array($this, 'verify_api_key')
        ));
        
        register_rest_route('wp-genie/v1', '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => array($this, 'verify_api_key')
        ));
        
        register_rest_route('wp-genie/v1', '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'verify_api_key')
        ));
    }
    
    public function verify_api_key($request) {
        $api_key = $request->get_header('X-WP-Genie-Key');
        $stored_key = get_option('wp_genie_api_key');
        
        return $api_key && $api_key === $stored_key;
    }
    
    public function create_post($request) {
        $params = $request->get_params();
        
        $post_data = array(
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => wp_kses_post($params['content']),
            'post_status' => 'publish',
            'post_author' => 1,
            'post_type' => 'post'
        );
        
        if (!empty($params['category'])) {
            $category = get_category_by_slug($params['category']);
            if ($category) {
                $post_data['post_category'] = array($category->term_id);
            }
        }
        
        if (!empty($params['scheduled_for'])) {
            $post_data['post_status'] = 'future';
            $post_data['post_date'] = $params['scheduled_for'];
        }
        
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            return new WP_Error('post_creation_failed', $post_id->get_error_message(), array('status' => 500));
        }
        
        // Handle featured image if provided
        if (!empty($params['featured_image_url'])) {
            $this->set_featured_image($post_id, $params['featured_image_url']);
        }
        
        return array(
            'success' => true,
            'post_id' => $post_id,
            'post_url' => get_permalink($post_id)
        );
    }
    
    public function get_categories($request) {
        $categories = get_categories(array(
            'hide_empty' => false
        ));
        
        $formatted_categories = array();
        foreach ($categories as $category) {
            $formatted_categories[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'count' => $category->count
            );
        }
        
        return $formatted_categories;
    }
    
    public function get_status($request) {
        return array(
            'connected' => true,
            'version' => WP_GENIE_VERSION,
            'site_url' => home_url(),
            'posts_count' => wp_count_posts()->publish,
            'categories_count' => wp_count_terms('category')
        );
    }
    
    private function set_featured_image($post_id, $image_url) {
        $image_id = $this->upload_image_from_url($image_url, $post_id);
        if ($image_id) {
            set_post_thumbnail($post_id, $image_id);
        }
    }
    
    private function upload_image_from_url($url, $post_id) {
        $tmp = download_url($url);
        
        if (is_wp_error($tmp)) {
            return false;
        }
        
        $file_array = array(
            'name' => basename($url),
            'tmp_name' => $tmp
        );
        
        $id = media_handle_sideload($file_array, $post_id);
        
        if (is_wp_error($id)) {
            @unlink($tmp);
            return false;
        }
        
        return $id;
    }
    
    private function create_tables() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'wp_genie_logs';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            action varchar(100) NOT NULL,
            details text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

// AJAX handlers
add_action('wp_ajax_wp_genie_test_connection', 'wp_genie_test_connection');
add_action('wp_ajax_wp_genie_update_status', 'wp_genie_update_status');

function wp_genie_test_connection() {
    if (!wp_verify_nonce($_POST['nonce'], 'wp_genie_test')) {
        wp_die('Security check failed');
    }
    
    $api_key = get_option('wp_genie_api_key');
    $user_token = get_option('wp_genie_user_token');
    
    if (empty($user_token)) {
        wp_send_json_error('User token is required');
        return;
    }
    
    // Test connection to WP Genie API
    $response = wp_remote_post(WP_GENIE_API_URL . '/api/wordpress/verify', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $user_token
        ),
        'body' => json_encode(array(
            'site_url' => home_url(),
            'api_key' => $api_key
        ))
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error('Failed to connect to WP Genie API');
        return;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if ($data && $data['success']) {
        wp_send_json_success('Connection successful');
    } else {
        wp_send_json_error($data['message'] ?? 'Connection failed');
    }
}

function wp_genie_update_status() {
    if (!wp_verify_nonce($_POST['nonce'], 'wp_genie_update')) {
        wp_die('Security check failed');
    }
    
    update_option('wp_genie_connected', $_POST['connected'] === 'true');
    wp_send_json_success();
}

// Initialize the plugin
new WPGenieConnector();
?>