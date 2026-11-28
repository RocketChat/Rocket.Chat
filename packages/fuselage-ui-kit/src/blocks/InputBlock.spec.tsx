import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';

type InputBlockOverrides = {
	element?: { type: string; actionId: string; [key: string]: unknown };
	hint?: UiKit.PlainText;
};

const renderInputBlock = (
	{ element = { type: 'plain_text_input', actionId: 'teams' }, hint }: InputBlockOverrides,
	context: Partial<React.ContextType<typeof UiKitContext>> = {},
) =>
	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action: jest.fn(), values: {}, ...context }}>
				{modalParser.render([
					{
						type: 'input',
						appId: 'app',
						blockId: 'block',
						label: { type: 'plain_text', text: 'Teams' },
						hint,
						element,
					} as UiKit.InputBlock,
				])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

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

it('keeps the selected options in the view state under the app and block of the input block', async () => {
	const updateState = jest.fn();
	renderInputBlock(
		{
			element: {
				type: 'multi_static_select',
				actionId: 'teams',
				placeholder: { type: 'plain_text', text: 'Pick' },
				options: [
					{ value: 'red', text: { type: 'plain_text', text: 'Red' } },
					{ value: 'blue', text: { type: 'plain_text', text: 'Blue' } },
				],
			},
		},
		{ updateState },
	);

	await userEvent.click(screen.getByRole('combobox'));
	await userEvent.click(await screen.findByRole('option', { name: 'Blue' }));

	expect(updateState).toHaveBeenCalledWith({ appId: 'app', blockId: 'block', actionId: 'teams', value: ['blue'] }, expect.anything());
});

it('shows the error the server returned for its element', () => {
	renderInputBlock({}, { errors: { teams: 'Pick at least one team' } });

	expect(screen.getByText('Pick at least one team')).toBeInTheDocument();
});

it('shows its hint under the element', () => {
	renderInputBlock({ hint: { type: 'plain_text', text: 'Teams that see the report' } });

	expect(screen.getByText('Teams that see the report')).toBeInTheDocument();
});
