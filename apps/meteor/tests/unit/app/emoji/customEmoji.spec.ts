import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import proxyquire from 'proxyquire';

import { emoji } from '../../../../app/emoji/client/lib';
import { getEmojiConfig } from '../../../../app/emoji-native/lib/getEmojiConfig';

const { updateEmojiCustom, deleteEmojiCustom } = proxyquire.noCallThru().load('../../../../client/lib/customEmoji', {
	'../../app/utils/client': { getURL: (path: string) => path },
});

const registerNativeEmojis = () => {
	const config = getEmojiConfig(emoji);

	emoji.packages.native = {
		emojiCategories: config.emojiCategories as any,
		emojisByCategory: config.emojisByCategory,
		toneList: config.toneList,
		render: config.render,
		renderPicker: config.renderPicker,
		sprites: config.sprites,
	};

	for (const [key, currentEmoji] of Object.entries(config.emojiList)) {
		currentEmoji.emojiPackage = 'native';
		emoji.list[key] = currentEmoji as any;
	}
};

const registerCustomEmojiPackage = () => {
	emoji.packages.emojiCustom = {
		emojiCategories: [{ key: 'rocket', i18n: 'Custom' as any }],
		emojisByCategory: { rocket: [] },
		list: [],
		toneList: {},
		render: (html: string) => html,
		renderPicker: () => '<span class="emoji-custom" />',
	} as any;
};

describe('customEmoji (client)', () => {
	before(() => {
		registerNativeEmojis();
		registerCustomEmojiPackage();
	});

	it('restores the native emoji when a shadowing custom emoji is deleted', () => {
		expect(emoji.list[':dog:']?.emojiPackage).to.equal('native');

		updateEmojiCustom({ name: 'dog', extension: 'png' } as any);
		expect(emoji.list[':dog:']?.emojiPackage).to.equal('emojiCustom');

		deleteEmojiCustom({ name: 'dog' } as any);
		expect(emoji.list[':dog:'], 'native :dog: must come back after the shadowing custom emoji is removed').to.exist;
		expect(emoji.list[':dog:']?.emojiPackage).to.equal('native');
	});
});
