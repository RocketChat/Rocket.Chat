import { after, afterEach, before, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let imperativeModal: (typeof import('@rocket.chat/ui-client'))['imperativeModal'];
let banners: typeof import('../banners');
let e2e: (typeof import('./rocketchat.e2e'))['e2e'];
let dispatchToastMessage: (typeof import('../toast'))['dispatchToastMessage'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

describe('E2E password modal', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-client'), {
			exports: {
				imperativeModal: {
					open: fn<FunctionLike>(),
					close: fn<FunctionLike>(),
				},
			},
		});
		mock.module('../../../client/lib/getUserAvatarURL', {
			exports: {
				getUserAvatarURL: fn<FunctionLike>(),
			},
		});
		mock.module('../../../app/utils/lib/i18n', {
			exports: {
				t: (key: string) => key,
			},
		});
		mock.module('../toast', {
			exports: {
				dispatchToastMessage: fn<FunctionLike>(),
			},
		});
		mock.module('../banners', {
			exports: {
				closeById: fn<FunctionLike>(),
				open: fn<FunctionLike>(),
			},
		});
		({ imperativeModal } = require('@rocket.chat/ui-client'));
		banners = require('../banners');
		({ e2e } = require('./rocketchat.e2e'));
		({ dispatchToastMessage } = require('../toast'));
	});

	after(leaveModuleScope);
	const getModalProps = () => (imperativeModal.open as Mock<FunctionLike>).mock.calls.at(-1)?.[0].props;

	afterEach(() => {
		mocker.restoreAllMocks();
		mocker.clearAllMocks();
	});

	it('keeps the E2EE alert open when the modal header close button is used', () => {
		e2e.openEnterE2EEPasswordModal(fn<FunctionLike>());

		getModalProps().onClose();

		expect(imperativeModal.close).toHaveBeenCalledTimes(1);
		expect(banners.closeById).not.toHaveBeenCalled();
	});

	it('dismisses the E2EE alert when the user explicitly cancels entering the password', () => {
		e2e.openEnterE2EEPasswordModal(fn<FunctionLike>());

		getModalProps().onCancel();

		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'info', message: 'End_To_End_Encryption_Not_Enabled' });
		expect(imperativeModal.close).toHaveBeenCalledTimes(1);
		expect(banners.closeById).toHaveBeenCalledWith('e2e');
	});

	it('dismisses the E2EE alert after the password is entered successfully', async () => {
		const onEnterE2EEPassword = fn<FunctionLike>().mockResolvedValue(undefined);

		e2e.openEnterE2EEPasswordModal(onEnterE2EEPassword);

		await getModalProps().onConfirm('password');

		expect(onEnterE2EEPassword).toHaveBeenCalledWith('password');
		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'success', message: 'E2E_encryption_enabled' });
		expect(imperativeModal.close).toHaveBeenCalledTimes(1);
		expect(banners.closeById).toHaveBeenCalledWith('e2e');
	});
});
