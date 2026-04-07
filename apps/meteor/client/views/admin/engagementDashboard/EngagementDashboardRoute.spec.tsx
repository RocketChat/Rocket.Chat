import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';

import EngagementDashboardRoute from './EngagementDashboardRoute';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

jest.mock('../../../hooks/useHasLicenseModule', () => ({ useHasLicenseModule: jest.fn() }));
jest.mock('../../../components/GenericUpsellModal/hooks', () => ({ useUpsellActions: jest.fn() }));
jest.mock('./EngagementDashboardPage', () => () => null);
jest.mock('../../../components/PageSkeleton', () => () => null);
jest.mock('../../notAuthorized/NotAuthorizedPage', () => () => null);
jest.mock('../../../../app/utils/client/getURL', () => ({ getURL: (path: string) => path }));

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
	const unsubscribes: jest.Mock[] = [];

	const subscribeToRouteChange = jest.fn((_cb: () => void) => {
		const unsub = jest.fn();
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

beforeEach(() => {
	jest.clearAllMocks();

	jest.mocked(useHasLicenseModule).mockReturnValue({
		isPending: false,
		data: true,
	} as unknown as ReturnType<typeof useHasLicenseModule>);

	jest.mocked(useUpsellActions).mockReturnValue({
		shouldShowUpsell: false,
		cloudWorkspaceHadTrial: false,
		handleManageSubscription: jest.fn(),
		handleTalkToSales: jest.fn(),
	});
});

describe('EngagementDashboardRoute', () => {
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
		const navigate = jest.fn();
		const { subscribeToRouteChange, getLastRouteChangeCallback } = createSubscribeTracker();

		render(<EngagementDashboardRoute />, {
			wrapper: buildWrapper({ subscribeToRouteChange, navigate }, 'users'),
		});

		const routeChangeCallback = getLastRouteChangeCallback();
		routeChangeCallback();

		expect(navigate).not.toHaveBeenCalled();
	});

	it('redirects to the users tab when the tab is invalid', () => {
		const navigate = jest.fn();
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
