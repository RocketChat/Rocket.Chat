import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';

it('labels its element with the block label', () => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Name' },
					element: { type: 'plain_text_input', appId: 'app', blockId: 'block', actionId: 'name' },
				},
			])}
		</MockedServerContext>,
	);

	expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
});

it('describes its element with the block hint', () => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Name' },
					hint: { type: 'plain_text', text: 'As shown on your profile' },
					element: { type: 'plain_text_input', appId: 'app', blockId: 'block', actionId: 'name', multiline: true },
				},
			])}
		</MockedServerContext>,
	);

	expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('As shown on your profile');
});

it('describes its element with the error and marks it invalid', () => {
	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action: () => undefined, values: {}, errors: { name: 'Name is required' } }}>
				{modalParser.render([
					{
						type: 'input',
						label: { type: 'plain_text', text: 'Name' },
						hint: { type: 'plain_text', text: 'As shown on your profile' },
						element: { type: 'plain_text_input', appId: 'app', blockId: 'block', actionId: 'name' },
					},
				])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	const input = screen.getByRole('textbox', { name: 'Name' });

	expect(input).toHaveAccessibleDescription('Name is required As shown on your profile');
	expect(input).toBeInvalid();
});

it.each([
	['datepicker', 'Starts on'],
	['time_picker', 'Starts at'],
] as const)('labels and describes a %s element', (type, label) => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: label },
					hint: { type: 'plain_text', text: 'In your local time zone' },
					element: { type, appId: 'app', blockId: 'block', actionId: 'start' },
				},
			])}
		</MockedServerContext>,
	);

	expect(screen.getByLabelText(label)).toHaveAccessibleDescription('In your local time zone');
});

it('labels and describes a multi_static_select element', () => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Plan' },
					hint: { type: 'plain_text', text: 'Pick one or more' },
					element: {
						type: 'multi_static_select',
						appId: 'app',
						blockId: 'block',
						actionId: 'plan',
						placeholder: { type: 'plain_text', text: 'Select' },
						options: [{ text: { type: 'plain_text', text: 'Pro' }, value: 'pro' }],
					},
				},
			])}
		</MockedServerContext>,
	);

	expect(screen.getByRole('combobox', { name: 'Plan' })).toHaveAccessibleDescription('Pick one or more');
});
