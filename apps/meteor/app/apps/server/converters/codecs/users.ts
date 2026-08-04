import type { IAppsUser } from '@rocket.chat/apps';
import type { IUser } from '@rocket.chat/core-typings';
import { removeEmpty } from '@rocket.chat/tools';
import * as z from 'zod';

import { UserStatusConnectionCodec, UserTypeCodec } from './enums';

const VALID_STATUS_CONNECTIONS = new Set(['offline', 'online', 'away', 'busy']);

/**
 * Rocket.Chat `IUser` <-> Apps-Engine `IAppsUser`.
 *
 * Both directions are bespoke (no `_unmappedProperties_` bucket): `decode` mirrors `convertToApp`
 * and `encode` mirrors `convertToRocketChat`. Enum fields go through the shared enum codecs. The
 * contextual "invalid status" warning stays here (rather than in `UserStatusConnectionCodec`)
 * because it needs the user's id/username. On the `encode` side `utcOffset` falls back to the legacy
 * misspelled `utfOffset` property, so app users that only carry the historical typo still convert.
 */
export const UserCodec = z.codec(z.custom<IUser>(), z.custom<IAppsUser>(), {
	decode: (user): IAppsUser => {
		const { statusConnection } = user;
		if (typeof statusConnection !== 'undefined' && !VALID_STATUS_CONNECTIONS.has(statusConnection)) {
			console.warn(
				`The user ${user.username} (${user._id}) does not have a valid status (offline, online, away, or busy). It is currently: "${statusConnection}"`,
			);
		}

		return {
			id: user._id,
			username: user.username,
			emails: user.emails,
			type: z.decode(UserTypeCodec, user.type),
			isEnabled: user.active,
			name: user.name,
			roles: user.roles,
			bio: user.bio,
			status: user.status,
			statusText: user.statusText,
			statusConnection: z.decode(UserStatusConnectionCodec, statusConnection),
			utcOffset: user.utcOffset,
			createdAt: user.createdAt,
			updatedAt: user._updatedAt,
			lastLoginAt: user.lastLogin,
			appId: (user as { appId?: string }).appId,
			customFields: user.customFields,
			isFederated: user.federated,
			federation: user.federation,
			sipExtension: user.freeSwitchExtension,
			settings: {
				preferences: {
					...(user?.settings?.preferences?.language && { language: user.settings.preferences.language }),
				},
			},
		} as unknown as IAppsUser;
	},
	encode: (user): IUser =>
		removeEmpty({
			_id: user.id,
			username: user.username,
			emails: user.emails,
			type: z.encode(UserTypeCodec, user.type),
			active: user.isEnabled,
			name: user.name,
			roles: user.roles,
			bio: user.bio,
			status: user.status,
			statusConnection: z.encode(UserStatusConnectionCodec, user.statusConnection),
			utcOffset: user.utcOffset ?? (user as { utfOffset?: number }).utfOffset,
			createdAt: user.createdAt,
			_updatedAt: user.updatedAt,
			lastLogin: user.lastLoginAt,
			appId: user.appId,
			federated: user.isFederated,
			federation: user.federation,
			freeSwitchExtension: user.sipExtension,
		}) as unknown as IUser,
});
