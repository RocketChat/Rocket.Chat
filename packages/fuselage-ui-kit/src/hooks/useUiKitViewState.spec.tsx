import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useUiKitViewState } from './useUiKitViewState';
import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';
import type { UiKitViewState } from '../utils/createUiKitViewState';

const textInput = (label: string, actionId: string, initialValue?: string): UiKit.InputBlock => ({
	type: 'input',
	blockId: `${actionId}-block`,
	label: { type: 'plain_text', text: label },
	element: { type: 'plain_text_input', actionId, ...(initialValue !== undefined && { initialValue }) } as UiKit.PlainTextInputElement,
});

let viewState: UiKitViewState | undefined;

const View = ({ blocks }: { blocks: UiKit.LayoutBlock[] }) => {
	viewState = useUiKitViewState(blocks);
	return (
		<UiKitContext.Provider value={{ action: jest.fn(), viewState, viewId: 'view' }}>{modalParser.render(blocks)}</UiKitContext.Provider>
	);
};

it('shows each element its own value after the app moves the blocks around', async () => {
	const { rerender } = render(<View blocks={[textInput('Name', 'name', 'Ada'), textInput('Notes', 'notes')]} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.type(screen.getByLabelText('Notes'), 'hello');

	rerender(<View blocks={[textInput('Notes', 'notes'), textInput('Email', 'email', 'ada@example.com')]} />);

	expect(screen.getByLabelText('Notes')).toHaveValue('hello');
	expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
	expect(viewState?.getState()).toEqual({ 'notes-block': { notes: 'hello' }, 'email-block': { email: 'ada@example.com' } });
});
