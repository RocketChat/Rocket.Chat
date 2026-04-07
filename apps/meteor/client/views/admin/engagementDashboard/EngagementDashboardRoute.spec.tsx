import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';

import EngagementDashboardRoute from './EngagementDashboardRoute';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: jest.fn(),
	useRouteParameter: jest.fn(() => 'users'),
}));

jest.mock('../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: jest.fn(),
}));

jest.mock('../../../components/GenericUpsellModal/hooks', () => ({
	useUpsellActions: jest.fn(),
}));

jest.mock('./EngagementDashboardPage', () => () => null);
jest.mock('../../../components/PageSkeleton', () => () => null);
jest.mock('../../notAuthorized/NotAuthorizedPage', () => () => null);
jest.mock('../../../../app/utils/client/getURL', () => ({ getURL: (path: string) => path }));

const mockUseRouter = jest.mocked(useRouter);
const mockUseRouteParameter = jest.mocked(useRouteParameter);
const mockUseHasLicenseModule = jest.mocked(useHasLicenseModule);
const mockUseUpsellActions = jest.mocked(useUpsellActions);

const wrapper = mockAppRoot()
	.withPermission('view-engagement-dashboard')
	.withEndpoint('POST', '/v1/statistics.telemetry', () => ({}))
	.build();

beforeEach(() => {
	jest.clearAllMocks();
	mockUseHasLicenseModule.mockReturnValue({ isPending: false, data: true } as unknown as ReturnType<typeof useHasLicenseModule>);
	mockUseUpsellActions.mockReturnValue({
		shouldShowUpsell: false,
		cloudWorkspaceHadTrial: false,
		handleManageSubscription: jest.fn(),
		handleTalkToSales: jest.fn(),
	});
	mockUseRouteParameter.mockReturnValue('users');
});

describe('EngagementDashboardRoute - route change subscription', () => {
	it('calls subscribeToRouteChange on mount', () => {
		const unsubscribe = jest.fn();
		const subscribeToRouteChange = jest.fn(() => unsubscribe);
		mockUseRouter.mockReturnValue({ subscribeToRouteChange, navigate: jest.fn() } as unknown as RouterContextValue);

		render(<EngagementDashboardRoute />, { wrapper });

		expect(subscribeToRouteChange).toHaveBeenCalledTimes(1);
	});

	it('calls the unsubscribe function returned by subscribeToRouteChange when unmounted', () => {
		const unsubscribe = jest.fn();
		const subscribeToRouteChange = jest.fn(() => unsubscribe);
		mockUseRouter.mockReturnValue({ subscribeToRouteChange, navigate: jest.fn() } as unknown as RouterContextValue);

		const { unmount } = render(<EngagementDashboardRoute />, { wrapper });

		expect(unsubscribe).not.toHaveBeenCalled();

		unmount();

		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('does not navigate when the current tab is valid', () => {
		const navigate = jest.fn();
		let capturedCallback = (): void => undefined;
		const subscribeToRouteChange = jest.fn((cb: () => void) => {
			capturedCallback = cb;
			return jest.fn();
		});
		mockUseRouter.mockReturnValue({ subscribeToRouteChange, navigate } as unknown as RouterContextValue);

		render(<EngagementDashboardRoute />, { wrapper });

		expect(subscribeToRouteChange).toHaveBeenCalledTimes(1);
		capturedCallback();

		expect(navigate).not.toHaveBeenCalled();
	});

	it('navigates to the users tab when the current tab is invalid', () => {
		mockUseRouteParameter.mockReturnValue(undefined);

		const navigate = jest.fn();
		let capturedCallback = (): void => undefined;
		const subscribeToRouteChange = jest.fn((cb: () => void) => {
			capturedCallback = cb;
			return jest.fn();
		});
		mockUseRouter.mockReturnValue({ subscribeToRouteChange, navigate } as unknown as RouterContextValue);

		render(<EngagementDashboardRoute />, { wrapper });

		expect(subscribeToRouteChange).toHaveBeenCalledTimes(1);
		capturedCallback();

		expect(navigate).toHaveBeenCalledWith({ pattern: '/admin/engagement/:tab?', params: { tab: 'users' } }, { replace: true });
	});

	it('unsubscribes the previous listener and resubscribes when dependencies change', () => {
		const firstUnsubscribe = jest.fn();
		const subscribeToRouteChange = jest.fn().mockReturnValueOnce(firstUnsubscribe).mockReturnValue(jest.fn());
		const navigate = jest.fn();
		mockUseRouter.mockReturnValue({ subscribeToRouteChange, navigate } as unknown as RouterContextValue);

		const { rerender } = render(<EngagementDashboardRoute />, { wrapper });

		expect(subscribeToRouteChange).toHaveBeenCalledTimes(1);
		expect(firstUnsubscribe).not.toHaveBeenCalled();

		mockUseRouteParameter.mockReturnValue('messages');
		rerender(<EngagementDashboardRoute />);

		expect(firstUnsubscribe).toHaveBeenCalledTimes(1);
		expect(subscribeToRouteChange).toHaveBeenCalledTimes(2);
	});
});
