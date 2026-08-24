import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { UserStatusConnection, UserType } from '@rocket.chat/apps-engine/definition/users';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as z from 'zod';

import {
	RoomTypeCodec,
	SettingTypeCodec,
	UserStatusConnectionCodec,
	UserTypeCodec,
} from '../../../../../../app/apps/server/converters/codecs/enums';

/*
 * These are copies of the legacy private helpers the codecs replace. They act as the oracle:
 * `decode` must produce identical output for every input the converters could see.
 */

function legacyUserType(type: string | undefined): string {
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
			return type.toUpperCase();
	}
}

function legacyStatusConnection(status: string | undefined): string {
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
			return UserStatusConnection.UNDEFINED;
		default:
			return !status ? UserStatusConnection.OFFLINE : status.toUpperCase();
	}
}

function legacyRoomType(typeChar: string): string {
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
}

function legacySettingType(type: string): string {
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
}

describe('apps converter enum codecs', () => {
	describe('UserTypeCodec', () => {
		const inputs = ['user', 'bot', 'app', '', undefined, 'newfangled'];

		it('decode matches the legacy _convertUserTypeToEnum for every input', () => {
			for (const input of inputs) {
				expect(z.decode(UserTypeCodec, input)).to.equal(legacyUserType(input));
			}
		});

		it('encode passes the Apps-Engine value straight through', () => {
			for (const value of Object.values(UserType)) {
				expect(z.encode(UserTypeCodec, value)).to.equal(value);
			}
		});
	});

	describe('UserStatusConnectionCodec', () => {
		const inputs = ['offline', 'online', 'away', 'busy', '', undefined, 'weird'];

		it('decode matches the legacy _convertStatusConnectionToEnum for every input', () => {
			for (const input of inputs) {
				expect(z.decode(UserStatusConnectionCodec, input)).to.equal(legacyStatusConnection(input));
			}
		});

		it('encode passes the Apps-Engine value straight through', () => {
			for (const value of Object.values(UserStatusConnection)) {
				expect(z.encode(UserStatusConnectionCodec, value)).to.equal(value);
			}
		});
	});

	describe('RoomTypeCodec', () => {
		const inputs = ['c', 'p', 'd', 'l', 'v'];

		it('decode matches the legacy _convertTypeToApp for every input', () => {
			for (const input of inputs) {
				expect(z.decode(RoomTypeCodec, input)).to.equal(legacyRoomType(input));
			}
		});

		it('encode passes the Apps-Engine value straight through', () => {
			for (const value of Object.values(RoomType)) {
				expect(z.encode(RoomTypeCodec, value)).to.equal(value);
			}
		});
	});

	describe('SettingTypeCodec', () => {
		const inputs = ['boolean', 'code', 'color', 'font', 'int', 'select', 'string', 'multiSelect'];

		it('decode matches the legacy _convertTypeToApp for every input', () => {
			for (const input of inputs) {
				expect(z.decode(SettingTypeCodec, input)).to.equal(legacySettingType(input));
			}
		});

		it('encode passes the Apps-Engine value straight through', () => {
			for (const value of Object.values(SettingType)) {
				expect(z.encode(SettingTypeCodec, value)).to.equal(value);
			}
		});
	});
});
