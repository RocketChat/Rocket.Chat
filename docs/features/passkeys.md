# Passkeys

## Overview

A passkey is a WebAuthn credential: a key pair whose private half stays on the user's device or in their password manager. A user adds passkeys under Account → Passkeys and signs in with one from the login page, without typing a username or a password. The browser shows the user the passkeys they have for the workspace, the user unlocks one with a fingerprint, their face, a screen lock or a security key's PIN, and the workspace checks its signature.

Passkeys are off by default. **`Accounts_Passkeys_Enabled`** (Administration → Settings → Accounts → Passkeys) turns on both adding them and signing in with them. Turning it off keeps the stored passkeys but refuses every ceremony until it is turned back on.

The WebAuthn protocol work is done by `@simplewebauthn/server` and `@simplewebauthn/browser`; the workspace stores the passkeys and the challenges, and applies its login policy.

## The relying party

Every passkey is bound to a relying party: the host of the **Site URL**. The browser only offers a passkey on that host, and the workspace only accepts signatures made for it, from the Site URL's origin. Two consequences:

- A workspace opened at any other address (another host name, an IP address) cannot use passkeys there.
- Moving the workspace to another domain makes every passkey unusable; users add new ones on the new domain.

Responses made in a cross-origin frame are refused, so a page that embeds the workspace in an iframe cannot use passkeys inside it.

## What a passkey must prove

- **User verification is required**, at registration and at every sign-in. The device verified who is holding it, so a passkey is two factors in one: signing in with a passkey does not ask for the TOTP or email code. Two-factor checks on later actions are unchanged.
- **Discoverable credentials are required.** The passkey stores the user's id, so the browser can offer it without a username; security keys that cannot store credentials cannot be added.
- **No attestation is requested.** The workspace does not verify which make of authenticator holds a passkey, and does not restrict which ones may be used. The AAGUID the authenticator reports is stored but not shown (see below).
- Accepted algorithms are EdDSA, ES256 and RS256.

## Ceremonies

Both ceremonies start with options from the workspace that carry a random challenge. A challenge is stored for five minutes and can be answered once: checking a response against it deletes it, whether or not the rest of the response verifies, so a captured response cannot be replayed. A registration challenge belongs to the user who asked for it. Only a well-formed challenge string from the response's client data is ever looked up.

**Adding a passkey** requires a signed-in user who confirms their second factor (TOTP or an email code), or their password when they have none, every time: the remember-me window and personal access tokens that skip two-factor do not apply. Without that, anyone holding a stolen session could add a passkey and keep access after the session is revoked and the password changed. Two consequences:

- A user who has neither a second factor nor a password, such as an account that only signs in through SAML, CAS or OAuth, cannot add passkeys until they set up a second factor.
- With two-factor authentication turned off for the whole workspace (`Accounts_TwoFactorAuthentication_Enabled`), nothing is asked, as for every other action that asks for a second factor.

A user can have up to 20 passkeys, and a credential can belong to one account only.

**Signing in** looks the passkey up by its credential id, checks that the user handle the authenticator returns is the passkey owner's id, and verifies the signature and the signature counter: a counter that goes backwards means the credential was cloned and the sign-in is refused, and of two sign-ins that present the same counter value only one succeeds. Synced passkeys always report 0 and are not checked. The workspace then applies the login policy of the other login methods (blocked addresses; deactivated, app and role-less users; a verified email when `Accounts_EmailVerification` requires one), records the attempt for the failed-login protection, notifies Apps-Engine apps, and starts a session.

When the passkey itself is refused, for any reason, the answer is `error-passkey-invalid`, and the server logs the reason as a `Passkeys` warning. A refusal by the login policy answers with that policy's error, as it does for a password.

## What the workspace shows about a passkey

Account → Passkeys lists the user's passkeys, and each one opens a panel with:

- **Type**: built into a device, a security key, or a phone or tablet, as the browser reported how the authenticator is attached and which transports it uses; *Unknown* when the browser reported neither.
- **Availability**: synced by a password manager across the user's devices, or bound to the device or key that created it.
- **Added** and **Last used**: when, and from which client, as the session list describes clients: the browser or Rocket.Chat app, its major version, and its operating system, read from the request's user agent.

The provider that keeps a passkey (iCloud Keychain, Google Password Manager, a security key's model) is not shown: telling it from the authenticator's AAGUID needs a registry of authenticators, and the ones available either carry no license or have to be fetched from the internet, which air-gapped workspaces cannot do.

## Relation to other login methods

- **Failed-login protection.** Failed passkey sign-ins count towards blocking the address they come from, and a blocked address cannot sign in with a passkey either. A user blocked after failed password attempts can still sign in with a passkey: the user lockout protects passwords from guessing, which does not apply to a passkey.
- **LDAP, SAML, CAS and OAuth.** Signing in with a passkey does not consult the directory or identity provider an account comes from. An account disabled there can still sign in with a passkey until it is deactivated in the workspace, as it can with an existing session. Workspaces that require every sign-in to go through their identity provider should keep passkeys off.
- **Deleting a user** deletes their passkeys. Deactivating a user keeps them, and refuses them until the user is reactivated.

## Endpoints

| Method | Path                                         | Auth | Purpose                                                          |
| ------ | -------------------------------------------- | ---- | ---------------------------------------------------------------- |
| GET    | `/v1/passkeys.list`                          | yes  | The user's passkeys: name, sync state, when added and last used. |
| POST   | `/v1/passkeys.generateRegistrationOptions`   | yes  | Options to create a passkey. Requires the second factor.         |
| POST   | `/v1/passkeys.register`                      | yes  | Stores the passkey created from those options, under a name.     |
| POST   | `/v1/passkeys.rename`                        | yes  | Renames one of the user's passkeys.                              |
| POST   | `/v1/passkeys.delete`                        | yes  | Deletes one of the user's passkeys. Requires the second factor.  |
| POST   | `/v1/passkeys.generateAuthenticationOptions` | no   | Options to sign in with any passkey.                             |
| POST   | `/v1/passkeys.login`                         | no   | Signs in; answers the new session's `userId` and `authToken`.    |

The unauthenticated endpoints are rate limited like the rest of the API, by client address, with `API_Enable_Rate_Limiter_Limit_Calls_Default` calls per `API_Enable_Rate_Limiter_Limit_Time_Default`. Each call for sign-in options stores a challenge until it is answered or expires after five minutes.

## Limitations

- Signing in is offered as a button; the browser's username autofill (conditional mediation) is not used yet.
- An administrator cannot list or remove another user's passkeys.
- The mobile apps cannot use passkeys: a native app needs its own association with the workspace's domain.
