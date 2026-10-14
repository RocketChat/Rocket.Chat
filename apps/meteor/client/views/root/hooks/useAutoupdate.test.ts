import { after, before, describe, it, mock } from 'node:test';

import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn, spyOn } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useToastMessageDispatch: (typeof import('@rocket.chat/ui-contexts'))['useToastMessageDispatch'];
let useAutoupdate: (typeof import('./useAutoupdate'))['useAutoupdate'];

describe('useAutoupdate', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				useToastMessageDispatch: fn<FunctionLike>(() => fn<FunctionLike>()),
			},
		});
		mock.module(require.resolve('react-i18next'), {
			exports: {
				useTranslation: () => ({
					t: (key: string) => key,
				}),
			},
		});
		({ useToastMessageDispatch } = require('@rocket.chat/ui-contexts'));
		({ useAutoupdate } = require('./useAutoupdate'));
	});

	after(leaveModuleScope);
	it('should add event listener to document on mount', () => {
		const addEventListenerSpy = spyOn(document, 'addEventListener');
		renderHook(() => useAutoupdate());
		expect(addEventListenerSpy).toHaveBeenCalled();
		expect(addEventListenerSpy).toHaveBeenCalledWith('client_changed', expect.any(Function));
	});

	it('should remove event listener on unmount', () => {
		const removeEventListenerSpy = spyOn(document, 'removeEventListener');
		const { unmount } = renderHook(() => useAutoupdate());
		unmount();
		expect(removeEventListenerSpy).toHaveBeenCalled();
		expect(removeEventListenerSpy).toHaveBeenCalledWith('client_changed', expect.any(Function));
	});

	it('should call toast function when client_changed event is fired', () => {
		const toastMock = fn<FunctionLike>();
		(useToastMessageDispatch as Mock<FunctionLike>).mockImplementation(() => toastMock);
		renderHook(() => useAutoupdate());

		const event = new Event('client_changed');
		document.dispatchEvent(event);

		expect(toastMock).toHaveBeenCalledTimes(1);
		expect(toastMock).toHaveBeenCalledWith({
			type: 'info',
			message: expect.anything(),
			options: { isPersistent: true },
		});
	});

	it('should not call toast function when client_changed event is not fired', () => {
		const toastMock = fn<FunctionLike>();
		(useToastMessageDispatch as Mock<FunctionLike>).mockImplementation(() => toastMock);
		renderHook(() => useAutoupdate());
		expect(toastMock).not.toHaveBeenCalled();
	});
});
