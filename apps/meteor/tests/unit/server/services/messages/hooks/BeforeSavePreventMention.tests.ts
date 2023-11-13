import { expect } from 'chai';
import proxyquire from 'proxyquire';

const Authorization = {
	hasPermission: async (_uid: string, _permission: string, _room?: string): Promise<boolean> => true,
};

class MeteorError extends Error {}

const { BeforeSavePreventMention } = proxyquire
	.noCallThru()
	.load('../../../../../../server/services/messages/hooks/BeforeSavePreventMention', {
		'@rocket.chat/core-services': {
			Authorization,
			MeteorError,
		},
		'../../../lib/i18n': {
			i18n: {
				t: (s: any) => s,
			},
		},
	});

describe('Prevent mention on messages', () => {
	it('should return void if message has no mentions', async () => {
		const preventMention = new BeforeSavePreventMention();

		return expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it("should return void if message doesnt't have @all mention", () => {
		const preventMention = new BeforeSavePreventMention();

		return expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'here' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it("should return void if message doesnt't have @here mention", () => {
		const preventMention = new BeforeSavePreventMention();

		return expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-here',
			}),
		).to.eventually.be.true;
	});

	it('should return true if user has required permission', () => {
		const preventMention = new BeforeSavePreventMention();

		Authorization.hasPermission = async () => true;

		return expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it('should return void if user has required permission on room scope', () => {
		const preventMention = new BeforeSavePreventMention();

		Authorization.hasPermission = async (_uid, _permission, room) => {
			if (room) {
				return true;
			}

			return false;
		};

		return expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.eventually.be.true;
	});

	it("should throw if user doesn't have required permissions", () => {
		Authorization.hasPermission = async (_uid, _permission, _room) => false;

		const preventMention = new BeforeSavePreventMention();

		return expect(
			preventMention.preventMention({
				message: { rid: 'GENERAL', msg: 'hey', mentions: [{ _id: 'all' }], u: { _id: 'random' } },
				user: { _id: 'userId', language: 'en' },
				mention: 'all',
				permission: 'mention-all',
			}),
		).to.be.rejectedWith(MeteorError);
	});
});
