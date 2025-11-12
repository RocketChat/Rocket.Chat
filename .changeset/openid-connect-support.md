---
"@rocket.chat/meteor": minor
---

Added full OpenID Connect (OIDC) authentication support

This major enhancement addresses issue #37489 by implementing native OpenID Connect support, going beyond the existing Custom OAuth implementation.

**Key Features:**
- Automatic endpoint discovery via `.well-known/openid-configuration`
- ID token support with standard claims extraction
- Single Logout (SLO) for centralized logout from both Rocket.Chat and identity provider
- Out-of-the-box compatibility with major providers (Keycloak, Microsoft Entra ID, Okta, Google, Auth0)
- Standard OpenID Connect claims (sub, preferred_username, email, name, picture, etc.)
- Configurable claim field mappings
- Support for role and group claims
- User merging across services

**Benefits over Custom OAuth:**
- No manual endpoint configuration needed (automatic discovery)
- Better security with ID token validation
- Native SLO support for enterprise requirements
- Seamless integration with enterprise identity providers
- Reduced configuration complexity

**Configuration:**
OpenID Connect providers can be configured via environment variables or the Admin UI under Settings → OAuth → OpenID Connect.

Example configuration:
```bash
Accounts_OpenID_Keycloak=true
Accounts_OpenID_Keycloak_id=your-client-id
Accounts_OpenID_Keycloak_secret=your-client-secret
Accounts_OpenID_Keycloak_url=https://keycloak.example.com/realms/master
Accounts_OpenID_Keycloak_enable_slo=true
```

**Documentation:**
- Full documentation: `apps/meteor/server/lib/openid/README.md`
- Quick start guide: `apps/meteor/server/lib/openid/QUICK_START.md`
- Configuration examples: `apps/meteor/server/lib/openid/examples.env`

**Migration:**
Existing Custom OAuth configurations will continue to work. Users can migrate to OpenID Connect at their convenience for enhanced features and better provider compatibility.
