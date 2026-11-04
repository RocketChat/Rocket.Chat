import { imperativeModal } from '@rocket.chat/ui-client';
import type { RouterContext } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ContextType } from 'react';

import { ActionManager } from './ActionManager';
import { sdk } from './SDKClient';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: { push: jest.fn() } }));
jest.mock('./SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));
jest.mock('./banners', () => ({ open: jest.fn(), closeById: jest.fn() }));
jest.mock('./toast', () => ({ dispatchToastMessage: jest.fn() }));

const appId = 'app-id';
const view = { appId, id: 'modal-id', title: { type: 'plain_text', text: 'Title' }, blocks: [] } as UiKit.ModalView;

const openModal = () => {
	const close = jest.fn();
	jest.mocked(imperativeModal.push).mockReturnValue({ close } as unknown as ReturnType<typeof imperativeModal.push>);

	const actionManager = new ActionManager({} as ContextType<typeof RouterContext>);
	actionManager.openView('modal', view);

	return { actionManager, close };
};

describe('modal.close', () => {
	it.each([
		['view.id', { view }],
		['viewId', { viewId: view.id }],
	])('closes the modal identified by %s', (_field, target) => {
		const { actionManager, close } = openModal();

		actionManager.handleServerInteraction({ type: 'modal.close', triggerId: actionManager.generateTriggerId(appId), appId, ...target });

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('leaves the modal open when the interaction names no view', () => {
		const { actionManager, close } = openModal();

		actionManager.handleServerInteraction({ type: 'modal.close', triggerId: actionManager.generateTriggerId(appId), appId });

		expect(close).not.toHaveBeenCalled();
	});
});

describe('modal stack', () => {
	const modalView = (id: string, otherAppId = appId) => ({ ...view, id, appId: otherAppId }) as UiKit.ModalView;
	const trigger = (actionManager: ActionManager, interaction: Record<string, unknown>) =>
		actionManager.handleServerInteraction({
			triggerId: actionManager.generateTriggerId(appId),
			appId,
			...interaction,
		} as UiKit.ServerInteraction);

	const setup = () => {
		const closes = new Map<string, jest.Mock>();
		jest.mocked(imperativeModal.push).mockReset();
		jest.mocked(imperativeModal.push).mockImplementation(((descriptor: { props: { initialView: UiKit.ModalView } }) => {
			const close = jest.fn();
			closes.set(descriptor.props.initialView.id, close);
			return { close };
		}) as never);

		return { actionManager: new ActionManager({} as ContextType<typeof RouterContext>), closes };
	};

	it('stacks a pushed modal on top of the open one', () => {
		const { actionManager, closes } = setup();

		actionManager.openView('modal', modalView('a'));
		trigger(actionManager, { type: 'modal.push', view: modalView('b') });

		expect(imperativeModal.push).toHaveBeenCalledTimes(2);
		expect(closes.get('a')).not.toHaveBeenCalled();
	});

	it('replaces the top modal beyond three', () => {
		const { actionManager, closes } = setup();

		['a', 'b', 'c'].forEach((id) => trigger(actionManager, { type: 'modal.push', view: modalView(id) }));
		trigger(actionManager, { type: 'modal.push', view: modalView('d') });

		expect(closes.get('c')).toHaveBeenCalledTimes(1);
		expect(closes.get('a')).not.toHaveBeenCalled();
		expect(closes.get('b')).not.toHaveBeenCalled();
	});

	it('replaces the app modals when one is opened', () => {
		const { actionManager, closes } = setup();

		trigger(actionManager, { type: 'modal.push', view: modalView('a') });
		trigger(actionManager, { type: 'modal.push', view: modalView('b') });
		trigger(actionManager, { type: 'modal.open', view: modalView('c') });

		expect(closes.get('a')).toHaveBeenCalledTimes(1);
		expect(closes.get('b')).toHaveBeenCalledTimes(1);
		expect(closes.get('c')).not.toHaveBeenCalled();
	});

	it('clears only the modals of the app', () => {
		const { actionManager, closes } = setup();

		trigger(actionManager, { type: 'modal.push', view: modalView('a') });
		trigger(actionManager, { type: 'modal.push', view: modalView('b') });
		actionManager.openView('modal', modalView('other', 'other-app'));
		trigger(actionManager, { type: 'modal.clear' });

		expect(closes.get('a')).toHaveBeenCalledTimes(1);
		expect(closes.get('b')).toHaveBeenCalledTimes(1);
		expect(closes.get('other')).not.toHaveBeenCalled();
	});

	it('closes only the pushed modal that is disposed, leaving the one below', () => {
		const { actionManager, closes } = setup();

		trigger(actionManager, { type: 'modal.push', view: modalView('a') });
		trigger(actionManager, { type: 'modal.push', view: modalView('b') });
		actionManager.disposeView('b');

		expect(closes.get('b')).toHaveBeenCalledTimes(1);
		expect(closes.get('a')).not.toHaveBeenCalled();
	});

	it('keeps counting only the modals still open', () => {
		const { actionManager, closes } = setup();

		['a', 'b', 'c'].forEach((id) => trigger(actionManager, { type: 'modal.push', view: modalView(id) }));
		actionManager.disposeView('c');
		trigger(actionManager, { type: 'modal.push', view: modalView('d') });

		expect(closes.get('b')).not.toHaveBeenCalled();
	});
});

describe('emitInteraction', () => {
	const interaction: Parameters<ActionManager['emitInteraction']>[1] = {
		type: 'blockAction',
		actionId: 'a',
		payload: { blockId: 'b', value: undefined },
		container: { type: 'message', id: 'mid' },
		rid: 'rid',
		mid: 'mid',
	};

	beforeEach(() => {
		jest
			.mocked(sdk.rest.post)
			.mockReset()
			.mockResolvedValue({ type: 'errors' } as never);
	});

	it('posts the interaction to the app it names', async () => {
		const actionManager = new ActionManager({} as ContextType<typeof RouterContext>);

		await actionManager.emitInteraction(appId, interaction);

		expect(sdk.rest.post).toHaveBeenCalledWith(`/apps/ui.interaction/${appId}`, expect.objectContaining({ actionId: 'a' }));
	});

	it.each(['../../v1/users.removeOtherTokens', '..', 'a/b', '%2e%2e', ''])('sends nothing for the app ID %p', async (invalidAppId) => {
		const actionManager = new ActionManager({} as ContextType<typeof RouterContext>);

		await actionManager.emitInteraction(invalidAppId, interaction);

		expect(sdk.rest.post).not.toHaveBeenCalled();
	});
});
