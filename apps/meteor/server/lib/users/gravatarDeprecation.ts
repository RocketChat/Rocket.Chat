// Removal checklist (next major): gravatar branch in saveNewUser.ts, `emails`
// provider in getAvatarSuggestionForUser.ts, the `service !== 'gravatar'`
// filters in setUsername.ts and auth/startup.js, the `gravatar` and
// `@types/gravatar` dependencies, and the Accounts_SetDefaultAvatar
// deprecation alert (setting registration + i18n key). Existing user documents
// keep
// `avatarOrigin: 'gravatar'` (and their stored Avatars file) — harmless, no
// migration needed; avatarOrigin is only compared against upload/url/rest.
import { SystemLogger } from '../logger/system';

let warned = false;

export function warnGravatarDeprecation(): void {
	if (warned) {
		return;
	}

	warned = true;

	SystemLogger.warn(
		'Gravatar integration (default avatars and avatar suggestions based on the user e-mail address) is deprecated and will be removed in a future major release.',
	);
}
