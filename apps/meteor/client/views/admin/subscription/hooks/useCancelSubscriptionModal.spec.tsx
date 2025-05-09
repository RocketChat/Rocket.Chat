import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCancelSubscriptionModal } from './useCancelSubscriptionModal';
import createDeferredMockFn from '../../../../../tests/mocks/utils/createDeferredMockFn';

jest.mock('../../../../hooks/useLicense', () => ({
	...jest.requireActual('../../../../hooks/useLicense'),
	useLicenseName: () => ({ data: 'Starter' }),
}));

it('should open modal when open method is called', () => {
	const { result } = renderHook(() => useCancelSubscriptionModal(), {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Cancel__planName__subscription: 'Cancel {{planName}} subscription',
			})
			.build(),
	});

	expect(screen.queryByText('Cancel Starter subscription')).not.toBeInTheDocument();

	act(() => result.current.open());

	expect(screen.getByText('Cancel Starter subscription')).toBeInTheDocument();
});

it('should close modal cancel is clicked', async () => {
	const { result } = renderHook(() => useCancelSubscriptionModal(), {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Cancel__planName__subscription: 'Cancel {{planName}} subscription',
			})
			.build(),
	});

	act(() => result.current.open());
	expect(screen.getByText('Cancel Starter subscription')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Dont_cancel' }));

	expect(screen.queryByText('Cancel Starter subscription')).not.toBeInTheDocument();
});

it('should call remove license endpoint when confirm is clicked', async () => {
	const { fn: removeLicenseEndpoint, resolve } = createDeferredMockFn<{ success: boolean }>();

	const { result } = renderHook(() => useCancelSubscriptionModal(), {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/cloud.removeLicense', removeLicenseEndpoint)
			.withTranslations('en', 'core', {
				Cancel__planName__subscription: 'Cancel {{planName}} subscription',
			})
			.build(),
	});

	act(() => result.current.open());
	expect(result.current.isLoading).toBeFalsy();
	expect(screen.getByText('Cancel Starter subscription')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Cancel_subscription' }));
	expect(result.current.isLoading).toBeTruthy();
	await act(() => resolve({ success: true }));
	await waitFor(() => expect(result.current.isLoading).toBeFalsy());

	expect(removeLicenseEndpoint).toHaveBeenCalled();
	expect(screen.queryByText('Cancel Starter subscription')).not.toBeInTheDocument();
});
