# Custom Superset Branding Configuration

This guide explains how to customize the Apache Superset navigation bar to hide the logo and change the text from "Superset" to "Custom Dashboard".

## ✅ Configuration Applied

The custom branding has been applied directly to the existing `superset/config.py` file, and the login button has been removed from the navigation bar. The following changes were made:

### Modified Settings
- **APP_NAME**: Changed from "Superset" to "Custom Dashboard"
- **APP_ICON**: Set to empty string to hide the logo
- **THEME_DEFAULT**: Added custom theme configuration to override branding
- **Login Button**: Completely removed from the right side of the navigation bar

## How It Works

The configuration changes:
1. **Hide the logo** - The infinity symbol logo will no longer be visible
2. **Change app name** - "Custom Dashboard" appears instead of "Superset"
3. **Custom theme** - Additional theme customization for consistent branding

```python
# Custom branding configuration
APP_NAME = "Custom Dashboard"
APP_ICON = ""

# Custom theme configuration
THEME_DEFAULT = {
    "token": {
        "brandLogoAlt": "Custom Dashboard",
        "brandLogoUrl": "",
    }
}
```

## What Was Changed

The following configuration values were modified in `superset/config.py`:

### APP_NAME
- **Before**: `APP_NAME = "Superset"`
- **After**: `APP_NAME = "Custom Dashboard"`
- **Effect**: Changes the application name displayed throughout the UI

### APP_ICON
- **Before**: `APP_ICON = "/static/assets/images/superset-logo-horiz.png"`
- **After**: `APP_ICON = ""`
- **Effect**: Hides the logo completely by setting it to an empty string

### THEME_DEFAULT
- **Before**: `THEME_DEFAULT: Theme = {}`
- **After**: Custom theme configuration with branding overrides
- **Effect**: Provides consistent branding and hides logo at the theme level

### Login Button
- **Before**: Login button visible on the right side of navigation bar when user is anonymous
- **After**: Login button completely removed from the navigation bar
- **Effect**: Cleaner navigation bar without authentication prompts

## Restart Required

After these configuration changes, you must restart the Superset application for the changes to take effect.

## Troubleshooting

1. **Logo still visible**: Ensure you've restarted Superset after the changes
2. **Text not changing**: Check that the changes were saved to `superset/config.py`
3. **Theme not applying**: Verify the application was restarted after configuration changes

## Additional Customization

You can further customize the appearance by modifying the `THEME_DEFAULT` configuration in the same file:

```python
THEME_DEFAULT: Theme = {
    "token": {
        "brandLogoAlt": "Custom Dashboard",
        "brandLogoUrl": "",
        "colorPrimary": "#your-color",
        "fontFamily": "'Your Font', sans-serif",
        "borderRadius": 8,
    }
}
```

## Files Modified

- `superset/config.py` - Main configuration file with custom branding applied
- `superset-frontend/src/features/home/RightMenu.tsx` - Frontend component with login button removed

## Notes

- ✅ **Configuration applied directly** - No need for environment variables or separate files
- ✅ **Changes are permanent** - Modifications are saved to the main config file
- ✅ **Application level changes** - All branding updates are handled at the backend
- ⚠️ **Restart required** - Superset must be restarted for changes to take effect
- ⚠️ **Version control** - Consider committing these changes to your repository
