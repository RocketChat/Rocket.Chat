import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ActionManagerContext } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContextType } from 'react';

import UiKitModal from './UiKitModal';
import { uploadUiKitFile } from '../../../lib/uikit/uploadUiKitFile';

jest.mock('../../../lib/getURL', () => ({ getURL: (path: string) => path }));
jest.mock('../../../lib/RoomManager', () => ({ useOpenedRoom: () => 'GENERAL' }));
jest.mock('../../../lib/uikit/uploadUiKitFile', () => ({ uploadUiKitFile: jest.fn() }));

const emitInteraction = jest.fn(async () => undefined);

const on = jest.fn();

const actionManager = {
	emitInteraction,
	on,
	off: jest.fn(),
	disposeView: jest.fn(),
	clearModals: jest.fn(),
	suggestOptions: jest.fn(async () => ({})),
} as unknown as ContextType<typeof ActionManagerContext>;

const plainText = (text: string) => ({ type: 'plain_text', text }) as const;

const textInput = (label: string, actionId: string, blockId: string | undefined, initialValue?: string): UiKit.InputBlock => ({
	type: 'input',
	appId: 'app',
	...(blockId && { blockId }),
	label: plainText(label),
	element: {
		type: 'plain_text_input',
		appId: 'app',
		blockId: blockId as string,
		actionId,
		...(initialValue !== undefined && { initialValue }),
	},
});

const blocks: UiKit.ModalView['blocks'] = [
	textInput('Name', 'name', 'name-block', 'Ada'),
	textInput('Notes', 'notes', 'notes-block'),
	textInput('Nickname', 'nickname', undefined, 'ada'),
	{
		type: 'input',
		appId: 'app',
		blockId: 'color-block',
		label: plainText('Color'),
		element: {
			type: 'static_select',
			appId: 'app',
			blockId: 'color-block',
			actionId: 'color',
			placeholder: plainText('Pick a color'),
			options: [
				{ text: plainText('Red'), value: 'red' },
				{ text: plainText('Blue'), value: 'blue' },
			],
			initialOption: { text: plainText('Blue'), value: 'blue' },
		},
	},
	{
		type: 'actions',
		appId: 'app',
		blockId: 'actions-block',
		elements: [{ type: 'button', appId: 'app', blockId: 'actions-block', actionId: 'approve', text: plainText('Approve'), value: 'yes' }],
	},
];

const view = (overrides: Partial<UiKit.ModalView> = {}): UiKit.ModalView => ({
	id: 'view-id',
	appId: 'app',
	title: plainText('Form'),
	submit: { type: 'button', appId: 'app', blockId: 'submit', actionId: 'submit', text: plainText('Save') },
	close: { type: 'button', appId: 'app', blockId: 'close', actionId: 'close', text: plainText('Cancel') },
	blocks,
	...overrides,
});

const subscriptions = [{ rid: 'GENERAL', name: 'general', t: 'c' }];

const renderModal = (initialView: UiKit.ModalView = view()) =>
	render(<UiKitModal key={initialView.id} initialView={initialView} />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/subscriptions.get', () => ({ update: subscriptions, remove: [] }) as never)
			.wrap((children) => <ActionManagerContext.Provider value={actionManager}>{children}</ActionManagerContext.Provider>)
			.build(),
	});

const sentInteraction = (type: UiKit.UserInteraction['type']) => {
	const call = emitInteraction.mock.calls.find((args: unknown[]) => (args[1] as UiKit.UserInteraction).type === type) as
		unknown[] | undefined;
	return call?.[1] as Extract<UiKit.UserInteraction, { type: 'viewSubmit' | 'viewClosed' | 'blockAction' }> | undefined;
};

/** The state as the app receives it, after the trip through JSON. */
const sentState = (type: 'viewSubmit' | 'viewClosed') =>
	JSON.parse(JSON.stringify((sentInteraction(type)?.payload as { view: { state: unknown } }).view.state));

let modalRoot: HTMLElement;

beforeEach(() => {
	jest.clearAllMocks();
	modalRoot = document.createElement('div');
	modalRoot.id = 'modal-root';
	document.body.appendChild(modalRoot);
});

afterEach(() => {
	modalRoot.remove();
});

it('submits the initial values of the elements that have a block id', async () => {
	renderModal();

	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toEqual({
		'name-block': { name: 'Ada' },
		'notes-block': {},
		'color-block': { color: 'blue' },
		'actions-block': {},
	});
});

it('submits what the user typed', async () => {
	renderModal();

	await userEvent.clear(screen.getByLabelText('Name'));
	await userEvent.type(screen.getByLabelText('Name'), 'Grace');
	await userEvent.type(screen.getByLabelText('Notes'), 'hello');
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toEqual({
		'name-block': { name: 'Grace' },
		'notes-block': { notes: 'hello' },
		'color-block': { color: 'blue' },
		'actions-block': {},
	});
});

it('submits an edited element of an input block without block id under `default`', async () => {
	renderModal();

	await userEvent.clear(screen.getByLabelText('Nickname'));
	await userEvent.type(screen.getByLabelText('Nickname'), 'grace');
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toMatchObject({ default: { nickname: 'grace' } });
});

it('keeps the value of an action element in the state', async () => {
	renderModal();

	await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
	await waitFor(() => expect(sentInteraction('blockAction')).toBeDefined());
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toMatchObject({ 'actions-block': { approve: 'yes' } });
});

it('sends the state when the modal is cancelled', async () => {
	renderModal();

	await userEvent.type(screen.getByLabelText('Notes'), 'hello');
	await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

	expect(sentInteraction('viewClosed')?.payload).toMatchObject({ isCleared: false });
	expect(sentState('viewClosed')).toEqual({
		'name-block': { name: 'Ada' },
		'notes-block': { notes: 'hello' },
		'color-block': { color: 'blue' },
		'actions-block': {},
	});
});

it('sends the state when the modal is closed', async () => {
	renderModal();

	await userEvent.type(screen.getByLabelText('Notes'), 'hello');
	await userEvent.click(screen.getByRole('button', { name: 'Close' }));

	expect(sentInteraction('viewClosed')?.payload).toMatchObject({ isCleared: true });
	expect(sentState('viewClosed')).toEqual({
		'name-block': { name: 'Ada' },
		'notes-block': { notes: 'hello' },
		'color-block': { color: 'blue' },
		'actions-block': {},
	});
});

it('keeps what the user typed, seeds new elements and drops removed ones when the app updates the modal', async () => {
	renderModal(view({ blocks: [textInput('Name', 'name', 'name-block', 'Ada'), textInput('Notes', 'notes', 'notes-block', 'draft')] }));

	await userEvent.clear(screen.getByLabelText('Name'));
	await userEvent.type(screen.getByLabelText('Name'), 'Grace');

	const [[, handleUpdate]] = on.mock.calls as unknown as [[string, (interaction: UiKit.ServerInteraction) => void]];
	act(() =>
		handleUpdate({
			type: 'modal.update',
			triggerId: 'trigger-id',
			appId: 'app',
			view: view({
				blocks: [textInput('Name', 'name', 'name-block', 'Ada'), textInput('Email', 'email', 'email-block', 'ada@example.com')],
			}),
		} as UiKit.ServerInteraction),
	);

	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(sentState('viewSubmit')).toEqual({
		'name-block': { name: 'Grace' },
		'email-block': { email: 'ada@example.com' },
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

	renderModal(
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

	expect(sentState('viewSubmit')).toEqual({ 'files-block': { files: ['file-id'] } });
});

it('shows and submits the room on screen in a multi conversations select that defaults to it', async () => {
	renderModal(
		view({
			blocks: [
				{
					type: 'input',
					appId: 'app',
					blockId: 'where-block',
					label: plainText('Where'),
					element: {
						type: 'multi_conversations_select',
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

	expect(sentState('viewSubmit')).toEqual({ 'where-block': { where: ['GENERAL'] } });
});
