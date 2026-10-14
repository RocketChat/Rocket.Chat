import { after, before, describe, it, mock } from 'node:test';

import type { RouterContext } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { expect } from 'expect';
import { fn, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import type { ContextType } from 'react';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let imperativeModal: (typeof import('@rocket.chat/ui-client'))['imperativeModal'];
let ActionManager: (typeof import('./ActionManager'))['ActionManager'];

const appId = 'app-id';
const view = { appId, id: 'modal-id', title: { type: 'plain_text', text: 'Title' }, blocks: [] } as UiKit.ModalView;

const openModal = () => {
	const close = fn<FunctionLike>();
	mocked(imperativeModal.open).mockReturnValue({ close } as unknown as ReturnType<typeof imperativeModal.open>);

	const actionManager = new ActionManager({} as ContextType<typeof RouterContext>);
	actionManager.openView('modal', view);

	return { actionManager, close };
};

describe('modal.close', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-client'), {
			exports: {
				imperativeModal: { open: fn<FunctionLike>() },
			},
		});
		mock.module('./SDKClient', {
			exports: {
				sdk: { rest: { post: fn<FunctionLike>() } },
			},
		});
		mock.module('./banners', {
			exports: {
				open: fn<FunctionLike>(),
				closeById: fn<FunctionLike>(),
			},
		});
		mock.module('./toast', {
			exports: {
				dispatchToastMessage: fn<FunctionLike>(),
			},
		});
		({ imperativeModal } = require('@rocket.chat/ui-client'));
		({ ActionManager } = require('./ActionManager'));
	});

	after(leaveModuleScope);
	(
		[
			['view.id', { view }],
			['viewId', { viewId: view.id }],
		] as const
	).forEach(([_field, target]) => {
		it(`closes the modal identified by ${_field}`, () => {
			const { actionManager, close } = openModal();

			actionManager.handleServerInteraction({ type: 'modal.close', triggerId: actionManager.generateTriggerId(appId), appId, ...target });

			expect(close).toHaveBeenCalledTimes(1);
		});
	});

	it('leaves the modal open when the interaction names no view', () => {
		const { actionManager, close } = openModal();

		actionManager.handleServerInteraction({ type: 'modal.close', triggerId: actionManager.generateTriggerId(appId), appId });

		expect(close).not.toHaveBeenCalled();
	});
});
