import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../surfaces';

const renderInputs = (element: UiKit.InputBlock['element']) =>
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Other' },
					element: { type: 'plain_text_input', appId: 'app', blockId: 'other', actionId: 'other' },
				},
				{ type: 'input', label: { type: 'plain_text', text: 'Focused' }, element },
			])}
		</MockedServerContext>,
	);

const base = { appId: 'app', blockId: 'focused', actionId: 'focused', focus_on_load: true } as const;

const options: UiKit.Option[] = [
	{ text: { type: 'plain_text', text: 'A' }, value: 'a' },
	{ text: { type: 'plain_text', text: 'B' }, value: 'b' },
];

it.each([
	['plain_text_input', { ...base, type: 'plain_text_input' }, 'textbox'],
	['number_input', { ...base, type: 'number_input', is_decimal_allowed: false }, 'spinbutton'],
	['users_select', { ...base, type: 'users_select' }, 'textbox'],
	['multi_channels_select', { ...base, type: 'multi_channels_select' }, 'textbox'],
] as const)('focuses a %s marked focus_on_load', (_type, element, role) => {
	renderInputs(element);

	expect(screen.getAllByRole(role).at(-1)).toHaveFocus();
});

it.each([
	['checkbox', { ...base, type: 'checkbox', options }, 'checkbox'],
	['radio_button', { ...base, type: 'radio_button', options }, 'radio'],
] as const)('focuses the first option of a %s marked focus_on_load', (_type, element, role) => {
	renderInputs(element);

	expect(screen.getAllByRole(role)[0]).toHaveFocus();
});
