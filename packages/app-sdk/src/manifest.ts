/**
 * App manifest and permissions.
 *
 * Packaging is unchanged from today: an app is TypeScript, transpiled, bundled
 * and zipped, with an `app.json` manifest at its root. The SDK simply lets you
 * express the manifest (and the permission set) *in code* next to the code that
 * needs it. At build time the bundler emits/validates `app.json` from this
 * object and can cross-check that every declared capability's required
 * permission is present (a lint the legacy engine cannot do, because
 * capabilities are registered imperatively at runtime).
 */

/**
 * Permission scopes an app can request. Mirrors the legacy `AppPermissions`
 * catalog (the authoritative capability taxonomy). Union kept open-ended with a
 * branded string so new scopes don't break app compilation.
 */
export type PermissionScope =
	| 'user.read'
	| 'user.write'
	| 'room.read'
	| 'room.write'
	| 'message.read'
	| 'message.write'
	| 'upload.read'
	| 'upload.write'
	| 'persistence'
	| 'networking'
	| 'scheduler'
	| 'command'
	| 'ui.interact'
	| 'setting.read'
	| 'setting.write'
	| 'server-setting.read'
	| 'server-setting.write'
	| 'env.read'
	| 'livechat'
	| 'video-conference'
	| 'moderation'
	| 'contact'
	| 'role.read'
	| 'oauth-app'
	| 'outbound-comms'
	| 'cloud.workspace-token'
	| 'apis'
	| (string & {});

export interface AppAuthor {
	name: string;
	homepage?: string;
	support?: string;
}

export interface AppManifest {
	/** UUID v4, stable across versions. */
	id: string;
	name: string;
	/** Lowercase, hyphenated slug (`^([a-z]|-)+$`). */
	nameSlug: string;
	version: string;
	description: string;
	/** SemVer range of the SDK/engine the app targets. */
	requiredApiVersion?: string;
	author: AppAuthor;
	/** Relative path to the icon in the bundle. */
	icon?: string;
	/** Permissions the app requests; the admin approves them at install time. */
	permissions?: PermissionScope[];
}
