import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

// Stubs are built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. sinon is
// require()d inside the hoisted block because the top-level import has not executed at hoist time.
// NOTE: relative `vi.mock` specifiers are resolved relative to THIS spec file (not the source).
// `match` is exported from the hoisted sinon instance because matchers are instance-specific.
const { modelsMock, settingsMock, match } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		modelsMock: {
			LivechatContacts: {
				findOneEnabledById: sinon.stub(),
			},
		},
		settingsMock: {
			get: sinon.stub(),
		},
		match: sinon.match,
	};
});

vi.mock('@rocket.chat/models', () => modelsMock);
vi.mock('../../../../../../../app/settings/server', () => ({ settings: settingsMock }));

const { runIsAgentAvailableToTakeContactInquiry } = await import('../../../../../../server/patches/isAgentAvailableToTakeContactInquiry');

describe('isAgentAvailableToTakeContactInquiry', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneEnabledById.reset();
		settingsMock.get.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should return false if the contact is not found', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(undefined);
		const { value, error } = (await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{} as unknown as IOmnichannelSource,
			'rid',
		)) as { error: string; value: false };

		expect(value).to.be.false;
		expect(error).to.eq('error-invalid-contact');
		expect(modelsMock.LivechatContacts.findOneEnabledById.calledOnceWith('contactId', match({ projection: { unknown: 1, channels: 1 } })));
	});

	it('should return false if the contact is unknown and Livechat_Block_Unknown_Contacts is true', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({ unknown: true });
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		const { value, error } = (await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{} as unknown as IOmnichannelSource,
			'rid',
		)) as { error: string; value: false };
		expect(value).to.be.false;
		expect(error).to.eq('error-unknown-contact');
	});

	it('should return false if the contact is not verified and Livechat_Block_Unverified_Contacts is true', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			unknown: false,
			channels: [
				{ verified: false, visitor: { source: { type: 'channelName' }, visitorId: 'visitorId' } },
				{ verified: true, visitor: { source: { type: 'othername' }, visitorId: 'visitorId' } },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value, error } = (await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{ type: 'channelName' } as unknown as IOmnichannelSource,
			'rid',
		)) as { error: string; value: false };
		expect(value).to.be.false;
		expect(error).to.eq('error-unverified-contact');
	});

	it('should return true if the contact has the verified channel', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			unknown: false,
			channels: [
				{ verified: true, visitor: { source: { type: 'channelName' }, visitorId: 'visitorId' } },
				{ verified: false, visitor: { source: { type: 'othername' }, visitorId: 'visitorId' } },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value } = await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{ type: 'channelName' } as unknown as IOmnichannelSource,
			'rid',
		);
		expect(value).to.be.true;
	});

	it('should not look at the unknown field if the setting Livechat_Block_Unknown_Contacts is false', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			unknown: true,
			channels: [
				{ verified: true, visitor: { source: { type: 'channelName' }, visitorId: 'visitorId' } },
				{ verified: false, visitor: { source: { type: 'othername' }, visitorId: 'visitorId' } },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(false);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(true);
		const { value } = await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{ type: 'channelName' } as unknown as IOmnichannelSource,
			'rid',
		);
		expect(value).to.be.true;
	});

	it('should not look at the verified channels if Livechat_Block_Unverified_Contacts is false', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			unknown: false,
			channels: [
				{ verified: false, visitor: { source: { type: 'channelName' }, visitorId: 'visitorId' } },
				{ verified: false, visitor: { source: { type: 'othername' }, visitorId: 'visitorId' } },
			],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(true);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(false);
		const { value } = await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{ type: 'channelName' } as unknown as IOmnichannelSource,
			'rid',
		);
		expect(value).to.be.true;
	});

	it('should return true if there is a contact and the settings are false', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			unknown: false,
			channels: [],
		});
		settingsMock.get.withArgs('Livechat_Block_Unknown_Contacts').returns(false);
		settingsMock.get.withArgs('Livechat_Block_Unverified_Contacts').returns(false);
		const { value } = await runIsAgentAvailableToTakeContactInquiry(
			() => undefined,
			'visitorId',
			{ type: 'channelName' } as unknown as IOmnichannelSource,
			'rid',
		);
		expect(value).to.be.true;
	});
});
