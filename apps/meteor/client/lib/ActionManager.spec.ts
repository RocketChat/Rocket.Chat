import { imperativeModal } from '@rocket.chat/ui-client';
import type { RouterContext } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ContextType } from 'react';

import { ActionManager } from './ActionManager';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: { open: jest.fn() } }));
jest.mock('./SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));
jest.mock('./banners', () => ({ open: jest.fn(), closeById: jest.fn() }));
jest.mock('./toast', () => ({ dispatchToastMessage: jest.fn() }));

const appId = 'app-id';
const view = { appId, id: 'modal-id', title: { type: 'plain_text', text: 'Title' }, blocks: [] } as UiKit.ModalView;

const openModal = () => {
	const close = jest.fn();
	jest.mocked(imperativeModal.open).mockReturnValue({ close } as unknown as ReturnType<typeof imperativeModal.open>);

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
