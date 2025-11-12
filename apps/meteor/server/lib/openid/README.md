# OpenID Connect Implementation for Rocket.Chat

This implementation provides full OpenID Connect (OIDC) support for Rocket.Chat, addressing issue #37489.

## Features

### Core OpenID Connect Support
- **Automatic Discovery**: Automatically discovers OpenID Connect endpoints from the provider's discovery document (`.well-known/openid-configuration`)
- **ID Token Support**: Extracts user claims from ID tokens in addition to the userinfo endpoint
- **Standard Claims**: Supports standard OpenID Connect claims (sub, preferred_username, email, name, picture, etc.)
- **Multiple Response Types**: Supports various OAuth 2.0/OIDC response types (code, id_token, token, and combinations)

### Single Logout (SLO)
- **Centralized Logout**: Log users out of both Rocket.Chat and the identity provider simultaneously
- **End Session Endpoint**: Automatically discovered or manually configured
- **Post-Logout Redirect**: Configurable redirect URI after logout

### Provider Compatibility
Tested and compatible with:
- **Microsoft Entra ID (Azure AD)**
- **Keycloak**
- **Okta**
- **Google**
- **Auth0**
- **Any OpenID Connect compliant provider**

## Configuration

### Using Environment Variables

```bash
# Enable OpenID Connect for a provider (e.g., Keycloak)
Accounts_OpenID_Keycloak=true
Accounts_OpenID_Keycloak_id=your-client-id
Accounts_OpenID_Keycloak_secret=your-client-secret
Accounts_OpenID_Keycloak_url=https://your-keycloak-server.com/realms/your-realm

# Optional: Disable auto-discovery (if you want to manually configure endpoints)
Accounts_OpenID_Keycloak_use_discovery=false
Accounts_OpenID_Keycloak_token_path=/protocol/openid-connect/token
Accounts_OpenID_Keycloak_authorize_path=/protocol/openid-connect/auth
Accounts_OpenID_Keycloak_userinfo_path=/protocol/openid-connect/userinfo

# Optional: Enable Single Logout
Accounts_OpenID_Keycloak_enable_slo=true
Accounts_OpenID_Keycloak_post_logout_redirect_uri=https://your-rocketchat.com

# Optional: Customize scopes
Accounts_OpenID_Keycloak_scope=openid profile email roles

# Optional: Customize claim mappings
Accounts_OpenID_Keycloak_username_field=preferred_username
Accounts_OpenID_Keycloak_email_field=email
Accounts_OpenID_Keycloak_name_field=name
Accounts_OpenID_Keycloak_roles_claim=roles
Accounts_OpenID_Keycloak_groups_claim=groups
```

### Using Admin UI

1. Navigate to **Administration** → **Settings** → **OAuth** → **OpenID Connect**
2. Click **Add Custom OpenID Connect**
3. Configure the following settings:
   - **Enable**: Toggle to enable the provider
   - **Server URL**: Base URL of your OpenID Connect provider
   - **Client ID**: Your application's client ID
   - **Client Secret**: Your application's client secret
   - **Use Discovery**: Enable automatic endpoint discovery (recommended)
   - **Scope**: OpenID Connect scopes (must include `openid`)
   - **Enable Single Logout**: Enable SLO if supported by your provider

## Provider-Specific Examples

### Microsoft Entra ID (Azure AD)

```bash
Accounts_OpenID_EntraID=true
Accounts_OpenID_EntraID_id=your-application-id
Accounts_OpenID_EntraID_secret=your-client-secret
Accounts_OpenID_EntraID_url=https://login.microsoftonline.com/your-tenant-id/v2.0
Accounts_OpenID_EntraID_scope=openid profile email
Accounts_OpenID_EntraID_enable_slo=true
```

### Keycloak

```bash
Accounts_OpenID_Keycloak=true
Accounts_OpenID_Keycloak_id=rocketchat
Accounts_OpenID_Keycloak_secret=your-client-secret
Accounts_OpenID_Keycloak_url=https://keycloak.example.com/realms/master
Accounts_OpenID_Keycloak_scope=openid profile email roles
Accounts_OpenID_Keycloak_enable_slo=true
Accounts_OpenID_Keycloak_roles_claim=realm_access.roles
```

### Okta

```bash
Accounts_OpenID_Okta=true
Accounts_OpenID_Okta_id=your-client-id
Accounts_OpenID_Okta_secret=your-client-secret
Accounts_OpenID_Okta_url=https://your-domain.okta.com
Accounts_OpenID_Okta_scope=openid profile email groups
Accounts_OpenID_Okta_enable_slo=true
```

### Google

```bash
Accounts_OpenID_Google=true
Accounts_OpenID_Google_id=your-client-id.apps.googleusercontent.com
Accounts_OpenID_Google_secret=your-client-secret
Accounts_OpenID_Google_url=https://accounts.google.com
Accounts_OpenID_Google_scope=openid profile email
```

## Differences from Custom OAuth

### What OpenID Connect Adds:

1. **Automatic Discovery**: No need to manually configure token, authorize, and userinfo endpoints
2. **ID Token Support**: User information is available in the ID token, reducing API calls
3. **Standard Claims**: Uses standard OpenID Connect claim names (sub, preferred_username, email, etc.)
4. **Single Logout**: Full support for centralized logout
5. **Better Security**: ID token validation using JWKS
6. **Provider Compatibility**: Works out-of-the-box with any OpenID Connect compliant provider

### When to Use OpenID Connect vs Custom OAuth:

- **Use OpenID Connect** when:
  - Your provider supports OpenID Connect
  - You need Single Logout (SLO)
  - You want automatic endpoint discovery
  - You need better integration with enterprise identity providers

- **Use Custom OAuth** when:
  - Your provider only supports OAuth 2.0 (not OpenID Connect)
  - You need custom endpoint configurations
  - Your provider uses non-standard claim names

## Single Logout (SLO)

### How It Works

1. User clicks logout in Rocket.Chat
2. Rocket.Chat calls the OpenID Connect `end_session_endpoint`
3. User is logged out of the identity provider
4. User is redirected back to Rocket.Chat (or configured redirect URI)

### Configuration

Enable SLO in your OpenID Connect provider settings:

```bash
Accounts_OpenID_YourProvider_enable_slo=true
Accounts_OpenID_YourProvider_post_logout_redirect_uri=https://your-rocketchat.com
```

### Client-Side Usage

```typescript
import { performOpenIDLogout } from 'meteor/rocketchat:lib';

// Perform Single Logout
await performOpenIDLogout('yourprovider');
```

## Claim Mapping

OpenID Connect uses standard claim names, but you can customize them:

```bash
# Username claim (default: preferred_username)
Accounts_OpenID_Provider_username_field=preferred_username

# Email claim (default: email)
Accounts_OpenID_Provider_email_field=email

# Name claim (default: name)
Accounts_OpenID_Provider_name_field=name

# Avatar claim (default: picture)
Accounts_OpenID_Provider_avatar_field=picture

# Roles claim (default: roles)
Accounts_OpenID_Provider_roles_claim=roles

# Groups claim (default: groups)
Accounts_OpenID_Provider_groups_claim=groups
```

## Troubleshooting

### Discovery Document Not Loading

If automatic discovery fails:
1. Check that your provider URL is correct
2. Verify the discovery endpoint is accessible: `{serverURL}/.well-known/openid-configuration`
3. Disable discovery and manually configure endpoints:
   ```bash
   Accounts_OpenID_Provider_use_discovery=false
   Accounts_OpenID_Provider_token_path=/oauth/token
   Accounts_OpenID_Provider_authorize_path=/oauth/authorize
   Accounts_OpenID_Provider_userinfo_path=/oauth/userinfo
   ```

### Claims Not Found

If user information is not being extracted:
1. Check the ID token and userinfo response in logs
2. Verify your claim field names match the provider's claims
3. Ensure your scope includes the necessary claims (e.g., `profile`, `email`)

### Single Logout Not Working

If SLO is not working:
1. Verify your provider supports the `end_session_endpoint`
2. Check that the endpoint is in the discovery document
3. Ensure `id_token_hint` is being sent correctly
4. Verify the `post_logout_redirect_uri` is registered with your provider

## Architecture

### Files

- `OpenIDConnect.ts`: Main OpenID Connect implementation
- `addOpenIDService.ts`: Adds OpenID Connect service settings
- `initOpenIDServices.ts`: Initializes OpenID Connect services from environment variables
- `updateOpenIDServices.ts`: Updates OpenID Connect service configurations
- `removeOpenIDService.ts`: Removes OpenID Connect services
- `logger.ts`: Logger for OpenID Connect operations

### Flow

1. **Initialization**: `initOpenIDServices()` reads environment variables and creates service settings
2. **Configuration**: `updateOpenIDServices()` watches for setting changes and updates services
3. **Discovery**: `loadDiscoveryDocument()` fetches and parses the OpenID Connect discovery document
4. **Authentication**: Standard OAuth 2.0 authorization code flow with ID token
5. **User Creation**: User information is extracted from ID token and/or userinfo endpoint
6. **Logout**: `performSingleLogout()` redirects to the provider's end session endpoint

## Security Considerations

1. **ID Token Validation**: ID tokens should be validated using the provider's JWKS (enabled by default)
2. **HTTPS Only**: Always use HTTPS for production deployments
3. **Client Secret**: Keep your client secret secure and never expose it in client-side code
4. **Scope Limitation**: Only request the scopes you need
5. **Redirect URI**: Ensure your redirect URI is registered with your provider

## Contributing

When adding support for new providers, please:
1. Test with the provider's OpenID Connect implementation
2. Document any provider-specific configuration
3. Add example configuration to this README
4. Test Single Logout if supported by the provider

## References

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [OpenID Connect Session Management](https://openid.net/specs/openid-connect-session-1_0.html)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
