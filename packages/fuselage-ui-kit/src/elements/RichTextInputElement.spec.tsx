import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';
import { createUiKitViewState } from '../utils/createUiKitViewState';

const element = { appId: 'app', blockId: 'block', actionId: 'field', type: 'rich_text_input' } as const;

const renderInput = (initial_value?: any) => {
	const viewState = createUiKitViewState([]);
	render(
		<UiKitContext.Provider value={{ action: jest.fn(), viewState }}>
			{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Field' }, element: { ...element, initial_value } }])}
		</UiKitContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);
	return viewState;
};

it('shows the initial rich text as Markdown', () => {
	renderInput({
		type: 'rich_text',
		elements: [
			{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Hi', style: { bold: true } }] },
			{ type: 'rich_text_list', style: 'bullet', elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'one' }] }] },
		],
	});

	expect(screen.getByRole('textbox')).toHaveValue('**Hi**\n\n- one');
});

it('reports the typed Markdown as a rich_text value', async () => {
	const viewState = renderInput();

	await userEvent.type(screen.getByRole('textbox'), '**hey**');

	expect(viewState.getValue('field')?.value).toEqual({
		type: 'rich_text',
		elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'hey', style: { bold: true } }] }],
	});
});
