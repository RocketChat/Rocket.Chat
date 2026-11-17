import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ButtonElement from './ButtonElement';
import { UiKitContext } from '../contexts/UiKitContext';
import { messageParser } from '../surfaces';

const confirm: UiKit.ButtonElement['confirm'] = {
	title: { type: 'plain_text', text: 'Are you sure?' },
	text: { type: 'plain_text', text: 'This cannot be undone' },
	confirm: { type: 'plain_text', text: 'Yes, delete' },
	deny: { type: 'plain_text', text: 'Keep it' },
	style: 'danger',
};

const renderButton = (withConfirm: boolean, url?: string) => {
	const action = jest.fn();
	const block: UiKit.ButtonElement = {
		type: 'button',
		appId: 'test',
		blockId: 'test',
		actionId: 'test',
		text: { type: 'plain_text', text: 'Delete' },
		confirm: withConfirm ? confirm : undefined,
		url,
	};

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, values: {} }}>
				<ButtonElement index={0} block={block} context={BlockContext.ACTION} surfaceRenderer={messageParser} />
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	return { action };
};

it('dispatches the action when the user confirms', async () => {
	const { action } = renderButton(true);

	await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
	expect(action).not.toHaveBeenCalled();
	expect(await screen.findByText('This cannot be undone')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

	await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
});

it('does not dispatch the action when the user denies', async () => {
	const { action } = renderButton(true);

	await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
	await userEvent.click(await screen.findByRole('button', { name: 'Keep it' }));

	await waitFor(() => expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument());
	expect(action).not.toHaveBeenCalled();
});

it('dispatches immediately without a confirm dialog', async () => {
	const { action } = renderButton(false);

	await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

	await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
});

it('does not dispatch the action when the user presses Escape', async () => {
	const { action } = renderButton(true);

	await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
	await screen.findByText('Are you sure?');
	await userEvent.keyboard('{Escape}');

	await waitFor(() => expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument());
	expect(action).not.toHaveBeenCalled();
});

it('opens the url only after the user confirms', async () => {
	const open = jest.spyOn(window, 'open').mockImplementation(() => null);
	const { action } = renderButton(true, 'https://rocket.chat');

	await userEvent.click(screen.getByRole('link', { name: 'Delete' }));
	expect(open).not.toHaveBeenCalled();

	await userEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }));

	await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
	expect(open).toHaveBeenCalledWith('https://rocket.chat', '_blank', 'noopener');
	open.mockRestore();
});

it('makes the content behind the dialog inert while it is open', async () => {
	renderButton(true);
	const behind = document.createElement('div');
	document.body.appendChild(behind);

	await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
	expect(await screen.findByText('This cannot be undone')).toBeInTheDocument();
	expect(behind.inert).toBe(true);

	await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));
	expect(behind.inert).toBe(false);
	behind.remove();
});

it('drops the action when the element changes while the dialog is open', async () => {
	const action = jest.fn();
	const make = (actionId: string): UiKit.ButtonElement => ({
		type: 'button',
		appId: 'test',
		blockId: 'test',
		actionId,
		text: { type: 'plain_text', text: 'Delete' },
		confirm,
	});
	const ui = (actionId: string) => (
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, values: {} }}>
				<ButtonElement index={0} block={make(actionId)} context={BlockContext.ACTION} surfaceRenderer={messageParser} />
			</UiKitContext.Provider>
		</MockedServerContext>
	);
	const { rerender } = render(ui('one'));

	await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
	expect(await screen.findByText('This cannot be undone')).toBeInTheDocument();
	rerender(ui('two'));
	await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

	await waitFor(() => expect(screen.queryByText('This cannot be undone')).not.toBeInTheDocument());
	expect(action).not.toHaveBeenCalled();
});
