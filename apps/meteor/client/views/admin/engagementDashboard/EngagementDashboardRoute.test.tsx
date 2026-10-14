import { beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import proxyquire from 'proxyquire';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const buildWrapper = (router: Partial<RouterContextValue>, tab?: string) => {
	const builder = mockAppRoot()
		.withPermission('view-engagement-dashboard')
		.withEndpoint('POST', '/v1/statistics.telemetry', () => ({}))
		.withRouter(router);

	if (tab) {
		builder.withRouteParameter('tab', tab);
	}

	return builder.build();
};

const createSubscribeTracker = () => {
	const unsubscribes: Mock<FunctionLike>[] = [];

	const subscribeToRouteChange = fn<FunctionLike>((_cb: () => void) => {
		const unsub = fn<FunctionLike>();
		unsubscribes.push(unsub);
		return unsub;
	});

	const allUnsubscribed = () => unsubscribes.length > 0 && unsubscribes.every((u) => u.mock.calls.length > 0);

	const noneUnsubscribed = () => unsubscribes.every((u) => u.mock.calls.length === 0);

	const getLastRouteChangeCallback = () => {
		const callback = subscribeToRouteChange.mock.calls.at(-1)?.[0];
		expect(callback).toBeDefined();
		return callback as () => void;
	};

	return { subscribeToRouteChange, allUnsubscribed, noneUnsubscribed, getLastRouteChangeCallback };
};

const hooksMock = {
	useUpsellActions: fn<FunctionLike>(),
};

const { useUpsellActions } = hooksMock as unknown as typeof import('../../../components/GenericUpsellModal/hooks');

const useHasLicenseModuleMock = {
	useHasLicenseModule: fn<FunctionLike>(),
};

const { useHasLicenseModule } = useHasLicenseModuleMock as unknown as typeof import('../../../hooks/useHasLicenseModule');

const { default: EngagementDashboardRoute } = proxyquire
	.noCallThru()
	.load<typeof import('./EngagementDashboardRoute')>('./EngagementDashboardRoute', {
		'./EngagementDashboardPage': (
			() => () =>
				null
		)(),
		'../../../components/GenericUpsellModal/hooks': hooksMock,
		'../../../components/PageSkeleton': (
			() => () =>
				null
		)(),
		'../../../hooks/useHasLicenseModule': useHasLicenseModuleMock,
		'../../../lib/getURL': {
			getURL: (path: string) => path,
		},
		'../../notAuthorized/NotAuthorizedPage': (
			() => () =>
				null
		)(),
	});

describe('EngagementDashboardRoute', () => {
	beforeEach(() => {
		mocker.clearAllMocks();

		mocked(useHasLicenseModule).mockReturnValue({
			isPending: false,
			data: true,
		} as unknown as ReturnType<typeof useHasLicenseModule>);

		mocked(useUpsellActions).mockReturnValue({
			shouldShowUpsell: false,
			cloudWorkspaceHadTrial: false,
			handleManageSubscription: fn<FunctionLike>(),
			handleTalkToSales: fn<FunctionLike>(),
		});
	});
	it('subscribes to route changes on mount', () => {
		const { subscribeToRouteChange } = createSubscribeTracker();

		render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange }, 'users'),
		});

		expect(subscribeToRouteChange).toHaveBeenCalled();
	});

	it('unsubscribes all listeners on unmount', () => {
		const { subscribeToRouteChange, allUnsubscribed } = createSubscribeTracker();

		const { unmount } = render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange }, 'users'),
		});

		unmount();
		expect(allUnsubscribed()).toBe(true);
	});

	it('does not redirect when the tab is valid', () => {
		const navigate = fn<FunctionLike>();
		const { subscribeToRouteChange, getLastRouteChangeCallback } = createSubscribeTracker();

		render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange, navigate }, 'users'),
		});

		const routeChangeCallback = getLastRouteChangeCallback();
		routeChangeCallback();

		expect(navigate).not.toHaveBeenCalled();
	});

	it('redirects to the users tab when the tab is invalid', () => {
		const navigate = fn<FunctionLike>();
		const { subscribeToRouteChange, getLastRouteChangeCallback } = createSubscribeTracker();

		render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange, navigate }),
		});

		const routeChangeCallback = getLastRouteChangeCallback();
		routeChangeCallback();

		expect(navigate).toHaveBeenCalledWith({ pattern: '/admin/engagement/:tab?', params: { tab: 'users' } }, { replace: true });
	});

	it('cleans up all subscriptions on unmount and resubscribes on remount', () => {
		const first = createSubscribeTracker();

		const { unmount } = render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange: first.subscribeToRouteChange }, 'users'),
		});

		expect(first.subscribeToRouteChange).toHaveBeenCalled();
		unmount();
		expect(first.allUnsubscribed()).toBe(true);

		const second = createSubscribeTracker();

		render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange: second.subscribeToRouteChange }, 'messages'),
		});

		expect(second.subscribeToRouteChange).toHaveBeenCalled();
		expect(second.noneUnsubscribed()).toBe(true);
	});
});
