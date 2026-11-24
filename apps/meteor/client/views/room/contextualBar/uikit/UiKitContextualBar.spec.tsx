import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ActionManagerContext, RoomToolboxContext } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContextType } from 'react';

import UiKitContextualBar from './UiKitContextualBar';
import { uploadUiKitFile } from '../../../../lib/uikit/uploadUiKitFile';
import { RoomContext } from '../../contexts/RoomContext';

jest.mock('../../../../lib/getURL', () => ({ getURL: (path: string) => path }));
jest.mock('../../../../lib/uikit/uploadUiKitFile', () => ({ uploadUiKitFile: jest.fn() }));

const emitInteraction = jest.fn(async () => undefined);

const actionManager = {
	emitInteraction,
	on: jest.fn(),
	off: jest.fn(),
	disposeView: jest.fn(),
	clearModals: jest.fn(),
	suggestOptions: jest.fn(async () => ({})),
} as unknown as ContextType<typeof ActionManagerContext>;

const plainText = (text: string) => ({ type: 'plain_text', text }) as const;

const textInput = (label: string, actionId: string, blockId: string, initialValue?: string): UiKit.InputBlock => ({
	type: 'input',
	appId: 'app',
	blockId,
	label: plainText(label),
	element: {
		type: 'plain_text_input',
		appId: 'app',
		blockId,
		actionId,
		...(initialValue !== undefined && { initialValue }),
	},
});

const view = (overrides: Partial<UiKit.ContextualBarView> = {}): UiKit.ContextualBarView => ({
	id: 'view-id',
	appId: 'app',
	title: plainText('Form'),
	submit: { type: 'button', appId: 'app', blockId: 'submit', actionId: 'submit', text: plainText('Save') },
	close: { type: 'button', appId: 'app', blockId: 'close', actionId: 'close', text: plainText('Cancel') },
	blocks: [textInput('Name', 'name', 'name-block', 'Ada'), textInput('Notes', 'notes', 'notes-block')],
	...overrides,
});

const subscriptions = [{ rid: 'GENERAL', name: 'general', t: 'c' }];

const renderContextualBar = (initialView: UiKit.ContextualBarView = view()) =>
	render(<UiKitContextualBar key={initialView.id} initialView={initialView} />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/subscriptions.get', () => ({ update: subscriptions, remove: [] }) as never)
			.wrap((children) => (
				<ActionManagerContext.Provider value={actionManager}>
					<RoomContext.Provider value={{ rid: 'GENERAL', room: { _id: 'GENERAL' } as never, subscribed: true }}>
						<RoomToolboxContext.Provider value={{ actions: [], openTab: jest.fn(), closeTab: jest.fn() }}>
							{children}
						</RoomToolboxContext.Provider>
					</RoomContext.Provider>
				</ActionManagerContext.Provider>
			))
			.build(),
	});

const sentInteraction = (type: 'viewSubmit' | 'viewClosed') => {
	const call = emitInteraction.mock.calls.find((args: unknown[]) => (args[1] as UiKit.UserInteraction).type === type) as
		unknown[] | undefined;
	return call?.[1] as Extract<UiKit.UserInteraction, { type: 'viewSubmit' | 'viewClosed' }> | undefined;
};

/** The state as the app receives it, after the trip through JSON. */
const sentState = (type: 'viewSubmit' | 'viewClosed') =>
	JSON.parse(JSON.stringify((sentInteraction(type)?.payload as { view: { state: unknown } }).view.state));

beforeEach(() => {
	jest.clearAllMocks();
});

it('submits the initial values and what the user typed', async () => {
	renderContextualBar();

	await userEvent.type(screen.getByLabelText('Notes'), 'hello');
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toEqual({
		'name-block': { name: 'Ada' },
		'notes-block': { notes: 'hello' },
	});
});

it('sends the state when the contextual bar is cancelled', async () => {
	renderContextualBar();

	await userEvent.type(screen.getByLabelText('Notes'), 'hello');
	await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

	expect(sentInteraction('viewClosed')?.payload).toMatchObject({ isCleared: false });
	expect(sentState('viewClosed')).toEqual({
		'name-block': { name: 'Ada' },
		'notes-block': { notes: 'hello' },
	});
});

it('sends the state when the contextual bar is closed', async () => {
	renderContextualBar();

	await userEvent.type(screen.getByLabelText('Notes'), 'hello');
	await userEvent.click(screen.getByRole('button', { name: 'Close' }));

	expect(sentInteraction('viewClosed')?.payload).toMatchObject({ isCleared: true });
	expect(sentState('viewClosed')).toEqual({
		'name-block': { name: 'Ada' },
		'notes-block': { notes: 'hello' },
	});
});

it('keeps the submit disabled while a file is uploading, then submits its id', async () => {
	let finishUpload: (file: { _id: string; name: string }) => void = () => undefined;
	jest.mocked(uploadUiKitFile).mockImplementation(
		() =>
			new Promise((resolve) => {
				finishUpload = resolve;
			}),
	);

	renderContextualBar(
		view({
			blocks: [
				{
					type: 'input',
					appId: 'app',
					blockId: 'files-block',
					label: plainText('Attachments'),
					element: { type: 'file_input', appId: 'app', blockId: 'files-block', actionId: 'files' },
				},
			],
		}),
	);

	await userEvent.upload(screen.getByLabelText('UIKit_File_input_choose'), new File(['content'], 'report.pdf'));

	await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled());

	finishUpload({ _id: 'file-id', name: 'report.pdf' });

	await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(uploadUiKitFile).toHaveBeenCalledWith('GENERAL', expect.any(File));
	expect(sentState('viewSubmit')).toEqual({ 'files-block': { files: ['file-id'] } });
});

it('shows and submits the room on screen in a conversations select that defaults to it', async () => {
	renderContextualBar(
		view({
			blocks: [
				{
					type: 'input',
					appId: 'app',
					blockId: 'where-block',
					label: plainText('Where'),
					element: {
						type: 'conversations_select',
						appId: 'app',
						blockId: 'where-block',
						actionId: 'where',
						default_to_current_conversation: true,
					},
				},
			],
		}),
	);

	// The chip of the selection, not an option of the list.
	expect(await screen.findByRole('button', { name: /general/ })).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toEqual({ 'where-block': { where: 'GENERAL' } });
});
