import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';

const element = { appId: 'app', blockId: 'block', actionId: 'field', type: 'rich_text_input' } as const;

const renderInput = (updateState = jest.fn(), initial_value?: any) =>
	render(
		<UiKitContext.Provider value={{ action: jest.fn(), updateState, values: {} }}>
			{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Field' }, element: { ...element, initial_value } }])}
		</UiKitContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);

it('shows the initial rich text as Markdown', () => {
	renderInput(jest.fn(), {
		type: 'rich_text',
		elements: [
			{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Hi', style: { bold: true } }] },
			{ type: 'rich_text_list', style: 'bullet', elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'one' }] }] },
		],
	});

	expect(screen.getByRole('textbox')).toHaveValue('**Hi**\n\n- one');
});

it('reports the typed Markdown as a rich_text value', async () => {
	const updateState = jest.fn();
	renderInput(updateState);

	await userEvent.type(screen.getByRole('textbox'), '**hey**');

	expect(updateState).toHaveBeenLastCalledWith(
		expect.objectContaining({
			actionId: 'field',
			value: {
				type: 'rich_text',
				elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'hey', style: { bold: true } }] }],
			},
		}),
		expect.anything(),
	);
});
