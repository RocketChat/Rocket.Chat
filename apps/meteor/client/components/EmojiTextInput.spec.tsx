import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

import EmojiTextInput from './EmojiTextInput';
import { emoji } from '../../app/emoji/client';

import '@testing-library/jest-dom';

const appRoot = mockAppRoot().withUserPreference('useEmojis', true).withTranslations('en', 'core', {});

const ControlledEmojiTextInput = ({ initialValue = '', onChange }: { initialValue?: string; onChange?: (value: string) => void }) => {
	const [value, setValue] = useState(initialValue);

	return (
		<EmojiTextInput
			aria-label='status'
			value={value}
			onChange={(event: ChangeEvent<HTMLInputElement>) => {
				setValue(event.currentTarget.value);
				onChange?.(event.currentTarget.value);
			}}
		/>
	);
};

const keyEvent = (keyCode: number) => ({ keyCode, which: keyCode });

beforeAll(() => {
	Element.prototype.scrollIntoView = jest.fn();
	emoji.packages.test = {
		emojisByCategory: {},
		toneList: {},
		render: (handle: string) => `<span class="emojione" data-title="${handle}" title="${handle}">🚀</span>`,
		renderPicker: () => undefined,
	} as never;
	emoji.list[':rocket:'] = { emojiPackage: 'test' } as never;
	emoji.list[':rock:'] = { emojiPackage: 'test' } as never;
});

describe('EmojiTextInput', () => {
	it('renders the value as plain text in a text input', () => {
		render(<ControlledEmojiTextInput initialValue='shipping :rocket: today' />, { wrapper: appRoot.build() });

		expect(screen.getByRole('textbox', { name: 'status' })).toHaveValue('shipping :rocket: today');
	});

	it('emits the typed value', async () => {
		const onChange = jest.fn();
		render(<ControlledEmojiTextInput onChange={onChange} />, { wrapper: appRoot.build() });

		await userEvent.type(screen.getByRole('textbox', { name: 'status' }), 'busy');

		expect(onChange).toHaveBeenLastCalledWith('busy');
	});

	it('opens the autocomplete popup when typing `:` and a partial name', async () => {
		render(<ControlledEmojiTextInput />, { wrapper: appRoot.build() });

		await userEvent.type(screen.getByRole('textbox', { name: 'status' }), 'hello :ro');

		expect(await screen.findByRole('menu')).toBeInTheDocument();
		expect(await screen.findByText(':rocket:')).toBeInTheDocument();
		expect(await screen.findByText(':rock:')).toBeInTheDocument();
	});

	it('inserts the handle plus a trailing space when a suggestion is clicked', async () => {
		const onChange = jest.fn();
		render(<ControlledEmojiTextInput onChange={onChange} />, { wrapper: appRoot.build() });

		await userEvent.type(screen.getByRole('textbox', { name: 'status' }), 'hello :rocke');
		await userEvent.click(await screen.findByText(':rocket:'));

		expect(onChange).toHaveBeenLastCalledWith('hello :rocket: ');
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('selects the focused suggestion with Enter', async () => {
		const onChange = jest.fn();
		render(<ControlledEmojiTextInput onChange={onChange} />, { wrapper: appRoot.build() });

		const input = screen.getByRole('textbox', { name: 'status' });
		await userEvent.type(input, ':roc');
		await screen.findByText(':rocket:');
		fireEvent.keyDown(input, keyEvent(13));

		expect(onChange).toHaveBeenLastCalledWith(expect.stringMatching(/^:rock(et)?: $/));
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('closes the popup on Escape', async () => {
		render(<ControlledEmojiTextInput />, { wrapper: appRoot.build() });

		const input = screen.getByRole('textbox', { name: 'status' });
		await userEvent.type(input, ':roc');
		await screen.findByRole('menu');
		fireEvent.keyUp(input, keyEvent(27));

		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('closes the popup when the input loses focus', async () => {
		render(<ControlledEmojiTextInput />, { wrapper: appRoot.build() });

		const input = screen.getByRole('textbox', { name: 'status' });
		await userEvent.type(input, ':roc');
		await screen.findByRole('menu');
		fireEvent.blur(input);

		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('keeps the raw handle text as the value', () => {
		render(<ControlledEmojiTextInput initialValue='go :rocket:' />, { wrapper: appRoot.build() });

		expect(screen.getByRole('textbox', { name: 'status' })).toHaveValue('go :rocket:');
	});

	it('does not offer autocomplete when emojis are disabled by preference', async () => {
		render(<ControlledEmojiTextInput />, {
			wrapper: mockAppRoot().withUserPreference('useEmojis', false).withTranslations('en', 'core', {}).build(),
		});

		await userEvent.type(screen.getByRole('textbox', { name: 'status' }), 'hello :ro');

		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('is disabled when disabled', () => {
		render(<EmojiTextInput aria-label='status' value='away' onChange={() => undefined} disabled />, { wrapper: appRoot.build() });

		expect(screen.getByRole('textbox', { name: 'status' })).toBeDisabled();
	});
});
