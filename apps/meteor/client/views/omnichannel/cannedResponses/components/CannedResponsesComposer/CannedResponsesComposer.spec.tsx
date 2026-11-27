import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEmojiPicker } from '@rocket.chat/ui-emoji-picker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CannedResponsesComposer from './CannedResponsesComposer';
import { emoji } from '../../../../../lib/emoji';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserPreference: jest.fn(),
}));

jest.mock('@rocket.chat/ui-emoji-picker', () => ({
	...jest.requireActual('@rocket.chat/ui-emoji-picker'),
	useEmojiPicker: jest.fn(),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { exists: () => false },
	}),
}));

const mockedUseUserPreference = useUserPreference as jest.Mock;
const mockedUseEmojiPicker = useEmojiPicker as jest.Mock;

describe('CannedResponsesComposer emoji insertion', () => {
	const originalEmojiList = emoji.list;

	beforeAll(() => {
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

	afterAll(() => {
		emoji.list = originalEmojiList;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const renderWithPickedEmoji = (pickedEmojiName: string) => {
		mockedUseEmojiPicker.mockReturnValue({
			open: (_ref: Element, callback: (emojiName: string) => void) => callback(pickedEmojiName),
			isOpen: false,
			close: jest.fn(),
		});

		const onChange = jest.fn();
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

describe('CannedResponsesComposer placeholders', () => {
	beforeEach(() => {
		mockedUseUserPreference.mockReturnValue(true);
		mockedUseEmojiPicker.mockReturnValue({ open: jest.fn(), isOpen: false, close: jest.fn() });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('inserts the chosen placeholder at the caret, from the keyboard', async () => {
		const onChange = jest.fn();
		render(<CannedResponsesComposer onChange={onChange} />);

		const textArea = screen.getByRole('textbox');
		await userEvent.type(textArea, 'Hi !');
		(textArea as HTMLTextAreaElement).setSelectionRange(3, 3);

		screen.getByRole('button', { name: 'Insert_Placeholder' }).focus();
		await userEvent.keyboard('{Enter}');

		const [contactName] = await screen.findAllByRole('menuitem', { name: 'Name' });
		expect(contactName).toHaveFocus();
		await userEvent.keyboard('{Enter}');

		expect(onChange).toHaveBeenLastCalledWith('Hi {{contact.name}}!');
	});
});
