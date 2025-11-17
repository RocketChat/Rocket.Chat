# OpenID Connect Quick Start Guide

## 5-Minute Setup

### Step 1: Choose Your Provider

Pick one of these popular providers:
- **Keycloak** (self-hosted, open source)
- **Microsoft Entra ID** (Azure AD)
- **Okta**
- **Google**
- **Auth0**

### Step 2: Register Your Application

In your provider's admin console:
1. Create a new OAuth 2.0 / OpenID Connect application
2. Set the redirect URI to: `https://your-rocketchat.com/_oauth/[provider-name]`
3. Note your **Client ID** and **Client Secret**

### Step 3: Configure Rocket.Chat

#### Option A: Environment Variables (Recommended for Docker/Production)

Add to your `.env` file:

```bash
# Replace [Provider] with your provider name (e.g., Keycloak, EntraID, Okta)
Accounts_OpenID_[Provider]=true
Accounts_OpenID_[Provider]_id=your-client-id
Accounts_OpenID_[Provider]_secret=your-client-secret
Accounts_OpenID_[Provider]_url=https://your-provider-url.com
Accounts_OpenID_[Provider]_enable_slo=true
```

#### Option B: Admin UI

1. Go to **Administration** → **Settings** → **OAuth**
2. Scroll to **OpenID Connect** section
3. Click **Add Custom OpenID Connect**
4. Fill in the form:
   - **Name**: Your provider name
   - **Enable**: Toggle ON
   - **Server URL**: Your provider's base URL
   - **Client ID**: From Step 2
   - **Client Secret**: From Step 2
   - **Enable Single Logout**: Toggle ON (if supported)
5. Click **Save**

### Step 4: Test

1. Log out of Rocket.Chat
2. You should see a new button: "Sign in with [Provider]"
3. Click it and authenticate with your provider
4. You should be logged into Rocket.Chat!

## Provider-Specific Quick Configs

### Keycloak

```bash
Accounts_OpenID_Keycloak=true
Accounts_OpenID_Keycloak_id=rocketchat
Accounts_OpenID_Keycloak_secret=your-secret-here
Accounts_OpenID_Keycloak_url=https://keycloak.example.com/realms/master
Accounts_OpenID_Keycloak_enable_slo=true
```

**Redirect URI**: `https://your-rocketchat.com/_oauth/keycloak`

### Microsoft Entra ID (Azure AD)

```bash
Accounts_OpenID_EntraID=true
Accounts_OpenID_EntraID_id=your-application-id
Accounts_OpenID_EntraID_secret=your-client-secret
Accounts_OpenID_EntraID_url=https://login.microsoftonline.com/your-tenant-id/v2.0
Accounts_OpenID_EntraID_enable_slo=true
```

**Redirect URI**: `https://your-rocketchat.com/_oauth/entraid`

**Note**: In Azure Portal, add this redirect URI to your app registration.

### Okta

```bash
Accounts_OpenID_Okta=true
Accounts_OpenID_Okta_id=your-client-id
Accounts_OpenID_Okta_secret=your-client-secret
Accounts_OpenID_Okta_url=https://your-domain.okta.com
Accounts_OpenID_Okta_enable_slo=true
```

**Redirect URI**: `https://your-rocketchat.com/_oauth/okta`

### Google

```bash
Accounts_OpenID_Google=true
Accounts_OpenID_Google_id=your-client-id.apps.googleusercontent.com
Accounts_OpenID_Google_secret=your-client-secret
Accounts_OpenID_Google_url=https://accounts.google.com
```

**Redirect URI**: `https://your-rocketchat.com/_oauth/google`

**Note**: Google doesn't support SLO via OpenID Connect.

## Common Issues & Solutions

### Issue: "Discovery document not found"

**Solution**: 
- Check your Server URL is correct
- Try disabling discovery and manually configure endpoints:
  ```bash
  Accounts_OpenID_Provider_use_discovery=false
  Accounts_OpenID_Provider_token_path=/oauth/token
  Accounts_OpenID_Provider_authorize_path=/oauth/authorize
  Accounts_OpenID_Provider_userinfo_path=/oauth/userinfo
  ```

### Issue: "Invalid redirect URI"

**Solution**: 
- Ensure the redirect URI in your provider matches exactly: `https://your-rocketchat.com/_oauth/[provider-name]`
- Provider name should be lowercase
- Include the protocol (https://)

### Issue: "User information not found"

**Solution**: 
- Check your scope includes necessary claims: `openid profile email`
- Verify claim field names match your provider:
  ```bash
  Accounts_OpenID_Provider_username_field=preferred_username
  Accounts_OpenID_Provider_email_field=email
  Accounts_OpenID_Provider_name_field=name
  ```

### Issue: "Single Logout not working"

**Solution**: 
- Verify your provider supports the `end_session_endpoint`
- Check the endpoint is in the discovery document
- Ensure the post-logout redirect URI is registered with your provider

## Advanced Configuration

### Custom Scopes

```bash
Accounts_OpenID_Provider_scope=openid profile email roles groups
```

### Custom Claim Mappings

```bash
Accounts_OpenID_Provider_username_field=preferred_username
Accounts_OpenID_Provider_email_field=email
Accounts_OpenID_Provider_name_field=name
Accounts_OpenID_Provider_avatar_field=picture
Accounts_OpenID_Provider_roles_claim=realm_access.roles
Accounts_OpenID_Provider_groups_claim=groups
```

### User Merging

```bash
Accounts_OpenID_Provider_merge_users=true
Accounts_OpenID_Provider_key_field=email
```

### Button Customization

```bash
Accounts_OpenID_Provider_button_label_text=Sign in with SSO
Accounts_OpenID_Provider_button_color=#1d74f5
Accounts_OpenID_Provider_button_label_color=#FFFFFF
```

## Testing Checklist

- [ ] Login works
- [ ] User information is correctly populated (username, email, name)
- [ ] Avatar is displayed (if configured)
- [ ] Logout works
- [ ] Single Logout works (if enabled)
- [ ] User can log back in after logout
- [ ] Multiple users can log in
- [ ] Existing users can be merged (if configured)

## Getting Help

1. Check the logs: `docker logs rocketchat` or check server logs
2. Enable debug logging: Set `LOG_LEVEL=debug`
3. Review the full documentation: `apps/meteor/server/lib/openid/README.md`
4. Check the discovery document: `https://your-provider.com/.well-known/openid-configuration`
5. Verify your provider's documentation

## Next Steps

- Configure role mapping for enterprise features
- Set up channel mapping from groups
- Configure multiple providers
- Customize the login button appearance
- Set up user provisioning rules

## Resources

- [Full Documentation](./README.md)
- [Configuration Examples](./examples.env)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
