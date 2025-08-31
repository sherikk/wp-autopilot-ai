# WP Genie WordPress Plugin Installation Guide

## 📥 Download & Install

### Method 1: Direct Installation
1. Download the `wp-genie-plugin.php` file
2. Upload it to your WordPress site's `/wp-content/plugins/` directory
3. Go to WordPress Admin → Plugins
4. Find "WP Genie Connector" and click "Activate"

### Method 2: ZIP Installation
1. Create a new folder called `wp-genie-connector`
2. Place the `wp-genie-plugin.php` file inside this folder
3. Zip the folder
4. In WordPress Admin → Plugins → Add New → Upload Plugin
5. Upload the ZIP file and activate

## ⚙️ Configuration

### Step 1: Get Your Site API Key
1. After activation, go to **Settings → WP Genie** in your WordPress admin
2. Copy the automatically generated **Site API Key**

### Step 2: Connect in WP Genie Dashboard
1. Log into your WP Genie account
2. Go to **WordPress Sites** section
3. Click **"Add New Site"**
4. Enter your WordPress site details:
   - **Site Name**: Choose a friendly name
   - **Site URL**: Your WordPress site URL (e.g., `https://yoursite.com`)
   - **API Key**: Paste the Site API Key from Step 1
5. Click **"Connect Site"**

### Step 3: Get User Token (Optional)
1. In WP Genie dashboard, go to **Settings → API**
2. Copy your **User Token**
3. Back in WordPress Admin → Settings → WP Genie
4. Paste the User Token and save
5. Click **"Test Connection"** to verify everything works

## 🔧 Features Enabled

Once connected, your WordPress site can:

### ✅ Receive Posts from WP Genie
- Automatically create new posts
- Set featured images from URLs
- Assign to specific categories
- Schedule posts for future publication
- Handle tags and metadata

### ✅ Provide Site Information
- Share available categories with WP Genie
- Report site statistics (post count, etc.)
- Sync connection status

### ✅ Secure API Access
- All communication uses encrypted API keys
- REST API endpoints for secure data transfer
- Built-in WordPress security features

## 🛠️ API Endpoints Created

The plugin creates these REST API endpoints:

- `POST /wp-json/wp-genie/v1/posts` - Create new posts
- `GET /wp-json/wp-genie/v1/categories` - Get site categories  
- `GET /wp-json/wp-genie/v1/status` - Get connection status

## 🔍 Troubleshooting

### Connection Issues
1. **Plugin Not Found**: Ensure plugin is properly uploaded and activated
2. **API Key Invalid**: Regenerate key by deactivating/reactivating plugin
3. **Connection Failed**: Check if your site allows external API requests

### Post Creation Issues
1. **Posts Not Appearing**: Check user permissions and post status
2. **Images Not Working**: Verify featured image URLs are accessible
3. **Categories Missing**: Ensure categories exist in WordPress before publishing

### Common Error Messages
- `"Plugin not activated"` → Activate the WP Genie Connector plugin
- `"Invalid API key"` → Copy the correct API key from plugin settings
- `"Permission denied"` → Check WordPress user roles and capabilities

## 📊 Plugin Settings Page

The settings page shows:
- ✅ Connection status indicator
- 🔑 Your unique Site API Key
- 🔗 User Token field (optional)
- 📍 Site information (URL, REST endpoints)
- 🧪 Connection test button

## 🔒 Security Notes

- API keys are unique per site and automatically generated
- All API requests are authenticated and validated
- Plugin follows WordPress security best practices
- No sensitive data is stored in plain text

## 🆘 Support

If you encounter any issues:
1. Check the plugin settings page for connection status
2. Test the connection using the built-in test button
3. Verify your WordPress site allows REST API access
4. Contact WP Genie support with your Site API Key for assistance

---

**Need Help?** Visit our [Support Center] or contact us directly through the WP Genie dashboard.