import { after, afterEach, before, describe, it, mock } from 'node:test';

import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module(require.resolve('@rocket.chat/ui-contexts'), {
	exports: {
		...require('@rocket.chat/ui-contexts'),
		useUserPreference: fn<FunctionLike>(),
	},
});
mock.module('../../../../../contexts/EmojiPickerContext', {
	exports: {
		useEmojiPicker: fn<FunctionLike>(),
	},
});
mock.module(require.resolve('react-i18next'), {
	exports: {
		useTranslation: () => ({
			t: (key: string) => key,
		}),
	},
});
const { useUserPreference }: typeof import('@rocket.chat/ui-contexts') = require('@rocket.chat/ui-contexts');

const { default: CannedResponsesComposer }: typeof import('./CannedResponsesComposer') = require('./CannedResponsesComposer');
const {
	useEmojiPicker,
}: typeof import('../../../../../contexts/EmojiPickerContext') = require('../../../../../contexts/EmojiPickerContext');
const { emoji }: typeof import('../../../../../lib/emoji') = require('../../../../../lib/emoji');

const mockedUseUserPreference = useUserPreference as Mock<FunctionLike>;
const mockedUseEmojiPicker = useEmojiPicker as Mock<FunctionLike>;

describe('CannedResponsesComposer emoji insertion', () => {
	const originalEmojiList = emoji.list;

	before(() => {
		mockedUseUserPreference.mockReturnValue(true);

		emoji.list = {
			':grinning_face_with_big_eyes:': {
				category: 'people',
				emojiPackage: 'native',
				shortnames: [],
				uc_base: '1f603',
				uc_greedy: '1f603',
				uc_match: '1f603',
				uc_output: '1f603',
				unicode: '😃',
			},
			':my_custom_emoji:': {
				category: 'custom',
				emojiPackage: 'emojiCustom',
				shortnames: [],
				uc_base: '',
				uc_greedy: '',
				uc_match: '',
				uc_output: '',
			},
		};
	});

	after(() => {
		emoji.list = originalEmojiList;
	});

	afterEach(() => {
		mocker.clearAllMocks();
	});

	const renderWithPickedEmoji = (pickedEmojiName: string) => {
		mockedUseEmojiPicker.mockReturnValue({
			open: (_ref: Element, callback: (emojiName: string) => void) => callback(pickedEmojiName),
			isOpen: false,
			close: fn<FunctionLike>(),
		});

		const onChange = fn<FunctionLike>();
		render(<CannedResponsesComposer onChange={onChange} />);

		return { onChange };
	};

	it('inserts the unicode character when the picked emoji has a native unicode value', async () => {
		const { onChange } = renderWithPickedEmoji('grinning_face_with_big_eyes');

		const emojiButton = await screen.findByRole('button', { name: 'Emoji' });
		emojiButton.click();

		expect(onChange).toHaveBeenLastCalledWith('😃 ');
	});

	it('falls back to the raw shortcode text when the picked emoji has no unicode value (custom emoji)', async () => {
		const { onChange } = renderWithPickedEmoji('my_custom_emoji');

		const emojiButton = await screen.findByRole('button', { name: 'Emoji' });
		emojiButton.click();

		expect(onChange).toHaveBeenLastCalledWith(':my_custom_emoji: ');
	});
});
