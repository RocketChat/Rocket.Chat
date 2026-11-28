import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';

let workspaceSettings: Record<string, unknown> = {};

const emptyCursor = { toArray: async () => [] };

const characterLimitModule = p.noCallThru().load('../../../../lib/omnichannel/getLivechatMessageCharacterLimit', {
	'../../settings': { settings: { get: (key: string) => workspaceSettings[key] } },
});

const { settings } = p.noCallThru().load('./livechat', {
	'@rocket.chat/license': { License: { hasModule: () => false } },
	'@rocket.chat/models': {
		EmojiCustom: { find: () => emptyCursor },
		LivechatTrigger: { findEnabled: () => emptyCursor },
		LivechatDepartment: { findEnabledWithAgentsAndBusinessUnit: () => emptyCursor },
		LivechatVisitors: {},
		LivechatRooms: {},
	},
	'meteor/meteor': { Meteor: { absoluteUrl: () => 'http://localhost:3000/' } },
	'../../../../lib/callbacks': { callbacks: {} },
	'../../../../lib/omnichannel/Helper': { normalizeAgent: async () => undefined },
	'../../../../lib/omnichannel/settings': { getInitSettings: async () => workspaceSettings },
	'../../../../lib/omnichannel/getLivechatMessageCharacterLimit': characterLimitModule,
});

describe('livechat settings', () => {
	beforeEach(() => {
		workspaceSettings = { Message_MaxAllowedSize: 5000, Livechat_enable_message_character_limit: true };
	});

	it('announces the configured character limit', async () => {
		workspaceSettings.Livechat_message_character_limit = 10;

		const { settings: widgetSettings } = await settings();

		expect(widgetSettings.limitTextLength).to.equal(10);
	});

	[0, -1].forEach((limit) => {
		it(`announces Message_MaxAllowedSize when the limit is ${limit}`, async () => {
			workspaceSettings.Livechat_message_character_limit = limit;

			const { settings: widgetSettings } = await settings();

			expect(widgetSettings.limitTextLength).to.equal(5000);
		});
	});

	it('announces no limit when the character limit is disabled', async () => {
		workspaceSettings.Livechat_enable_message_character_limit = false;
		workspaceSettings.Livechat_message_character_limit = 10;

		const { settings: widgetSettings } = await settings();

		expect(widgetSettings.limitTextLength).to.equal(false);
	});
});
