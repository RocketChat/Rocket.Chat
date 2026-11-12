import { before, describe, it, mock } from 'node:test';

import { expect } from 'chai';

const Authorization = {
	hasPermission: async (_uid: string, _permission: string, _room?: string): Promise<boolean> => true,
};

class ClientSafeError extends Error {}

let BeforeSavePreventMention: any;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/core-services', {
			exports: {
				Authorization,
				ClientSafeError,
			},
		}),
		mock.module('../../../lib/i18n', {
			exports: {
				i18n: {
					t: (s: any) => s,
				},
			},
		}),
	];
	({ BeforeSavePreventMention } = await import('./BeforeSavePreventMention'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('Prevent mention on messages', () => {
	it('should return void if message has no mentions', async () => {
		const preventMention = new BeforeSavePreventMention();

		await expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it("should return void if message doesnt't have @all mention", async () => {
		const preventMention = new BeforeSavePreventMention();

		await expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'here' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it("should return void if message doesnt't have @here mention", async () => {
		const preventMention = new BeforeSavePreventMention();

		await expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-here',
			}),
		).to.eventually.be.true;
	});

	it('should return true if user has required permission', async () => {
		const preventMention = new BeforeSavePreventMention();

		Authorization.hasPermission = async () => true;

		await expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it('should return void if user has required permission on room scope', async () => {
		const preventMention = new BeforeSavePreventMention();

		Authorization.hasPermission = async (_uid, _permission, room) => {
			if (room) {
				return true;
			}

			return false;
		};

		await expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it("should throw if user doesn't have required permissions", async () => {
		Authorization.hasPermission = async (_uid, _permission, _room) => false;

		const preventMention = new BeforeSavePreventMention();

		await expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.be.rejectedWith(ClientSafeError);
	});
});
