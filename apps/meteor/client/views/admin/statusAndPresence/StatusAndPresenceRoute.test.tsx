import { beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { act, render } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import { STATUS_SETTING_IDS } from './SettingsTab';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

type RouteParams = Record<string, string>;

const createRouter = (initialParams: RouteParams = {}) => {
	let params = initialParams;
	const listeners = new Set<() => void>();

	const navigate = fn<FunctionLike>((to: { params: RouteParams }) => {
		params = to.params;
		listeners.forEach((listener) => listener());
	});

	const router: Partial<RouterContextValue> = {
		navigate: navigate as unknown as RouterContextValue['navigate'],
		getRouteParameters: () => params,
		subscribeToRouteChange: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};

	return { router, navigate, getParams: () => params };
};

const lastPageProps = () => mocked(StatusAndPresencePage).mock.lastCall?.[0];

const StatusAndPresencePageMock = (() => fn<FunctionLike>(() => null))();

const StatusAndPresencePage = StatusAndPresencePageMock;

const { default: StatusAndPresenceRoute } = proxyquire
	.noCallThru()
	.load<typeof import('./StatusAndPresenceRoute')>('./StatusAndPresenceRoute', {
		'./StatusAndPresencePage': StatusAndPresencePageMock,
	});

describe('StatusAndPresenceRoute', () => {
	beforeEach(() => {
		mocker.clearAllMocks();
	});
	it('opens the settings tab first when the status settings are loaded', () => {
		const { router, navigate } = createRouter();
		const builder = STATUS_SETTING_IDS.reduce((current, id) => current.withSetting(id, true), mockAppRoot());

		render(<StatusAndPresenceRoute />, { wrapper: builder.withPermission('manage-user-status').withRouter(router).build() });

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({ name: 'user-status', params: { tab: 'settings' } }, { replace: true });
		expect(lastPageProps()).toMatchObject({ tab: 'settings', settingIds: STATUS_SETTING_IDS });
	});

	it('skips the settings tab when the status settings are not loaded', () => {
		const { router, navigate } = createRouter();

		render(<StatusAndPresenceRoute />, { wrapper: mockAppRoot().withPermission('manage-user-status').withRouter(router).build() });

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({ name: 'user-status', params: { tab: 'custom-status' } }, { replace: true });
		expect(lastPageProps()).toMatchObject({ tab: 'custom-status', settingIds: [] });
	});

	it('keeps the user status tab out while the status visibility rules are disabled', () => {
		const { router } = createRouter({ tab: 'user-presence' });

		render(<StatusAndPresenceRoute />, {
			wrapper: mockAppRoot()
				.withSetting('Accounts_StatusVisibility_Admin_Enabled', false)
				.withPermission('edit-other-user-info')
				.withPermission('view-full-other-user-info')
				.withPermission('manage-user-status')
				.withRouter(router)
				.build(),
		});

		expect(lastPageProps()).toMatchObject({ canManageUserPresence: false });
	});

	it('opens the presence service panel once when the presence broadcast is disabled', () => {
		const { router, navigate, getParams } = createRouter({ tab: 'custom-status' });

		render(<StatusAndPresenceRoute />, {
			wrapper: mockAppRoot()
				.withSetting('Presence_broadcast_disabled', true)
				.withPermission('manage-user-status')
				.withRouter(router)
				.build(),
		});

		expect(getParams()).toEqual({ tab: 'custom-status', context: 'presence-service' });

		act(() => navigate({ params: { tab: 'custom-status' } }));

		expect(getParams()).toEqual({ tab: 'custom-status' });
		expect(navigate).toHaveBeenCalledTimes(2);
	});
});
