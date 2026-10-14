import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useRoomToolbox: (typeof import('@rocket.chat/ui-contexts'))['useRoomToolbox'];
let useAppsContextualBar: (typeof import('./useAppsContextualBar'))['useAppsContextualBar'];
let useUiKitActionManager: (typeof import('../../../uikit/hooks/useUiKitActionManager'))['useUiKitActionManager'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockGetInteractionPayloadByViewId = fn<FunctionLike>();
const mockOn = fn<FunctionLike>();
const mockOff = fn<FunctionLike>();
const mockCloseTab = fn<FunctionLike>();

describe('useAppsContextualBar', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				useRouteParameter: fn<FunctionLike>((param: string) => {
					if (param === 'context') return 'test-context';
					if (param === 'tab') return 'app';
					return undefined;
				}),

				useRoomToolbox: fn<FunctionLike>(),
			},
		});
		mock.module('../../../uikit/hooks/useUiKitActionManager', {
			exports: {
				useUiKitActionManager: fn<FunctionLike>(),
			},
		});
		({ useRoomToolbox } = require('@rocket.chat/ui-contexts'));
		({ useAppsContextualBar } = require('./useAppsContextualBar'));
		({ useUiKitActionManager } = require('../../../uikit/hooks/useUiKitActionManager'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		(useUiKitActionManager as Mock<FunctionLike>).mockReturnValue({
			getInteractionPayloadByViewId: mockGetInteractionPayloadByViewId,
			on: mockOn,
			off: mockOff,
		});
		(useRoomToolbox as Mock<FunctionLike>).mockReturnValue({ closeTab: mockCloseTab });
	});

	afterEach(() => {
		mocker.clearAllMocks();
	});

	it('should return the view when present', () => {
		const view = { id: 'view1' };
		mockGetInteractionPayloadByViewId.mockReturnValue({ view });

		const { result } = renderHook(() => useAppsContextualBar());

		expect(result.current).toBe(view);
	});

	it('should call closeTab if view is not present', () => {
		mockGetInteractionPayloadByViewId.mockReturnValue(undefined);

		renderHook(() => useAppsContextualBar());

		expect(mockCloseTab).toHaveBeenCalled();
	});
});
