import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';

let workspaceSettings: Record<string, unknown> = {};

const { getLivechatMessageCharacterLimit } = p.noCallThru().load('./getLivechatMessageCharacterLimit', {
	'../../settings': { settings: { get: (key: string) => workspaceSettings[key] } },
});

describe('getLivechatMessageCharacterLimit', () => {
	beforeEach(() => {
		workspaceSettings = { Message_MaxAllowedSize: 5000 };
	});

	it('returns undefined when the character limit is disabled', () => {
		workspaceSettings.Livechat_enable_message_character_limit = false;
		workspaceSettings.Livechat_message_character_limit = 10;

		expect(getLivechatMessageCharacterLimit()).to.be.undefined;
	});

	it('returns the configured limit when it is set', () => {
		workspaceSettings.Livechat_enable_message_character_limit = true;
		workspaceSettings.Livechat_message_character_limit = 10;

		expect(getLivechatMessageCharacterLimit()).to.equal(10);
	});

	[0, -1, '', undefined].forEach((limit) => {
		it(`falls back to Message_MaxAllowedSize when the limit is ${JSON.stringify(limit)}`, () => {
			workspaceSettings.Livechat_enable_message_character_limit = true;
			workspaceSettings.Livechat_message_character_limit = limit;

			expect(getLivechatMessageCharacterLimit()).to.equal(5000);
		});
	});
});
