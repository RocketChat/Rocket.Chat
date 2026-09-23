import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { UserStatusConnection, UserType } from '@rocket.chat/apps-engine/definition/users';
import * as z from 'zod';

/**
 * Bidirectional enum mappings between Rocket.Chat's stored string values and the
 * Apps-Engine enums, expressed as Zod codecs (`decode`: Rocket.Chat -> Apps-Engine,
 * `encode`: Apps-Engine -> Rocket.Chat).
 *
 * These are behaviour-preserving replacements for the private `_convert*ToApp`/`_convert*ToEnum`
 * helpers currently living inside the converter classes. The `decode` transforms reproduce the
 * exact fallback semantics of those helpers (including passing unknown values through, upper-cased
 * where the legacy code did so). The `encode` transforms mirror the reverse converters, which today
 * assign the Apps-Engine value straight back onto the Rocket.Chat document without translation.
 *
 * Note: the contextual `console.warn` calls that depend on data unavailable to a pure enum mapping
 * (e.g. the affected user's id/username in the status-connection warning) are intentionally left in
 * the converter layer and will be wired back in as each converter is migrated.
 */

/**
 * Rocket.Chat `IUser['type']` <-> Apps-Engine `UserType`.
 * Mirrors `AppUsersConverter._convertUserTypeToEnum`.
 */
export const UserTypeCodec = z.codec(z.any(), z.any(), {
	decode: (type): string => {
		switch (type) {
			case 'user':
				return UserType.USER;
			case 'bot':
				return UserType.BOT;
			case 'app':
				return UserType.APP;
			case '':
			case undefined:
				return UserType.UNKNOWN;
			default:
				console.warn(`A new user type has been added that the Apps don't know about? "${type}"`);
				return type.toUpperCase();
		}
	},
	// The reverse converter assigns `user.type` straight back onto the document.
	encode: (type): string => type,
});

/**
 * Rocket.Chat `IUser['statusConnection']` <-> Apps-Engine `UserStatusConnection`.
 * Mirrors the value mapping of `AppUsersConverter._convertStatusConnectionToEnum`. The legacy
 * `console.warn` (which includes the affected user's id/username) stays in the converter, since
 * that context is not available to a standalone codec.
 */
export const UserStatusConnectionCodec = z.codec(z.any(), z.any(), {
	decode: (status): string => {
		switch (status) {
			case 'offline':
				return UserStatusConnection.OFFLINE;
			case 'online':
				return UserStatusConnection.ONLINE;
			case 'away':
				return UserStatusConnection.AWAY;
			case 'busy':
				return UserStatusConnection.BUSY;
			case undefined:
				// This is needed for Livechat guests and Rocket.Cat user.
				return UserStatusConnection.UNDEFINED;
			default:
				return !status ? UserStatusConnection.OFFLINE : status.toUpperCase();
		}
	},
	encode: (status): string => status,
});

/**
 * Rocket.Chat `IRoom['t']` <-> Apps-Engine `RoomType`.
 * Mirrors `AppRoomsConverter._convertTypeToApp`. Unknown type characters pass through unchanged.
 */
export const RoomTypeCodec = z.codec(z.any(), z.any(), {
	decode: (typeChar): string => {
		switch (typeChar) {
			case 'c':
				return RoomType.CHANNEL;
			case 'p':
				return RoomType.PRIVATE_GROUP;
			case 'd':
				return RoomType.DIRECT_MESSAGE;
			case 'l':
				return RoomType.LIVE_CHAT;
			default:
				return typeChar;
		}
	},
	// `RoomType` values are identical to the stored `t` characters, so the reverse is an identity.
	encode: (type): string => type,
});

/**
 * Rocket.Chat `ISetting['type']` <-> Apps-Engine `SettingType`.
 * Mirrors `AppSettingsConverter._convertTypeToApp`. Unknown types pass through unchanged.
 */
export const SettingTypeCodec = z.codec(z.any(), z.any(), {
	decode: (type): string => {
		switch (type) {
			case 'boolean':
				return SettingType.BOOLEAN;
			case 'code':
				return SettingType.CODE;
			case 'color':
				return SettingType.COLOR;
			case 'font':
				return SettingType.FONT;
			case 'int':
				return SettingType.NUMBER;
			case 'select':
				return SettingType.SELECT;
			case 'string':
				return SettingType.STRING;
			default:
				return type;
		}
	},
	encode: (type): string => type,
});
