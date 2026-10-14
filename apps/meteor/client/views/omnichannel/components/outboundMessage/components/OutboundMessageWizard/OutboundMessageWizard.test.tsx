import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { StepsLinkedList, WizardContext } from '@rocket.chat/ui-client';
import { act, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeLicenseInfo } from '../../../../../../../tests/mocks/data';
import { createFakeProvider } from '../../../../../../../tests/mocks/data/outbound-message';
import { enterModuleScope, leaveModuleScope } from '../../../../../../../tests/mocks/moduleScope';
import type { OmnichannelContextValue } from '../../../../../../contexts/OmnichannelContext';

let OutboundMessageWizard: (typeof import('./OutboundMessageWizard'))['default'];
let OmnichannelContext: (typeof import('../../../../../../contexts/OmnichannelContext'))['OmnichannelContext'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const openUpsellModal = fn<FunctionLike>();

let currentOnSubmit: (payload: Record<string, unknown>) => void = () => undefined;

const steps = new StepsLinkedList([
	{ id: 'test-step-1', title: 'Test Step 1' },
	{ id: 'test-step-2', title: 'Test Step 2' },
	{ id: 'test-step-3', title: 'Test Step 3' },
]);

const mockWizardApi = {
	steps,
	currentStep: steps.head?.next ?? null,
	next: fn<FunctionLike>(),
	previous: fn<FunctionLike>(),
	register: fn<FunctionLike>(),
	goTo: fn<FunctionLike>(),
	resetNextSteps: fn<FunctionLike>(),
};

const getProvidersMock = fn<FunctionLike>().mockImplementation(() => ({ providers: [] }));
const getLicenseMock = fn<FunctionLike>().mockImplementation(() => ({
	license: createFakeLicenseInfo({
		activeModules: ['livechat-enterprise'],
	}),
}));

const appRoot = (omnichannelEnabled = true) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Livechat_enabled', omnichannelEnabled)
		.withEndpoint('GET', '/v1/omnichannel/outbound/providers', () => getProvidersMock())
		.withEndpoint('GET', '/v1/licenses.info', () => getLicenseMock())
		.wrap((children) => (
			<OmnichannelContext.Provider value={{ enabled: omnichannelEnabled } as OmnichannelContextValue}>
				<WizardContext.Provider value={mockWizardApi}>{children}</WizardContext.Provider>
			</OmnichannelContext.Provider>
		));

describe('OutboundMessageWizard', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../modals', {
			exports: {
				useOutboundMessageUpsellModal: () => ({
					open: openUpsellModal,
					close: fn<FunctionLike>(),
				}),
			},
		});
		mock.module(require.resolve('tinykeys'), {
			exports: {
				default: {
					__esModule: true,
					default: fn<FunctionLike>().mockReturnValue(() => () => undefined),
				},
			},
		});
		mock.module('../../../../../../../client/lib/getURL', {
			exports: {
				getURL: (url: string) => url,
			},
		});
		mock.module('./steps', {
			exports: {
				...require('./steps'),

				RecipientStep: fn<FunctionLike>().mockImplementation((props) => {
					currentOnSubmit = props.onSubmit;
					return <div data-testid='recipient-form'>form</div>;
				}),
			},
		});
		({ default: OutboundMessageWizard } = require('./OutboundMessageWizard'));
		({ OmnichannelContext } = require('../../../../../../contexts/OmnichannelContext'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	describe('error and loading states', () => {
		it('should render loading state', async () => {
			getProvidersMock.mockImplementationOnce(() => new Promise(() => undefined));

			render(<OutboundMessageWizard />, { wrapper: appRoot().withPermission('outbound.send-messages').build() });

			expect(await screen.findByRole('status')).toHaveAttribute('aria-busy', 'true');
		});

		it('should render unauthorized when user has no permission', async () => {
			render(<OutboundMessageWizard />, { wrapper: appRoot().build() });

			expect(await screen.findByText('You_are_not_authorized_to_access_this_feature')).toBeInTheDocument();
		});

		it('should render error state when omnichannel is disabled', async () => {
			render(<OutboundMessageWizard />, { wrapper: appRoot(false).build() });

			expect(await screen.findByText('Omnichannel_is_not_enabled')).toBeInTheDocument();
		});
	});

	describe('upsell flow', () => {
		it('should display upsell modal if module is not present', async () => {
			getLicenseMock.mockResolvedValueOnce({ license: createFakeLicenseInfo({ activeModules: [] }) });
			getProvidersMock.mockResolvedValueOnce({ providers: [] });

			render(<OutboundMessageWizard />, { wrapper: appRoot().build() });

			await waitFor(() => expect(openUpsellModal).toHaveBeenCalled());
		});

		it('should display upsell modal if module is present but theres no providers', async () => {
			getLicenseMock.mockResolvedValueOnce({ license: createFakeLicenseInfo({ activeModules: [] }) });
			getProvidersMock.mockResolvedValueOnce({ providers: [createFakeProvider()] });

			render(<OutboundMessageWizard />, { wrapper: appRoot().build() });

			await waitFor(() => expect(openUpsellModal).toHaveBeenCalled());
		});

		it('should display upsell modal on submit when module is present but provider is not', async () => {
			getLicenseMock.mockResolvedValueOnce({
				license: createFakeLicenseInfo({ activeModules: ['livechat-enterprise', 'outbound-messaging'] }),
			});
			getProvidersMock.mockResolvedValueOnce({ providers: [] });

			render(<OutboundMessageWizard />, { wrapper: appRoot().build() });

			await waitFor(() => expect(openUpsellModal).not.toHaveBeenCalled());

			await act(() => currentOnSubmit({}));

			await waitFor(() => expect(openUpsellModal).toHaveBeenCalled());
		});

		it('should not display upsell modal when module and provider is present', async () => {
			getProvidersMock.mockResolvedValueOnce({ providers: [createFakeProvider()] });
			getLicenseMock.mockResolvedValueOnce({
				license: createFakeLicenseInfo({ activeModules: ['livechat-enterprise', 'outbound-messaging'] }),
			});

			render(<OutboundMessageWizard />, { wrapper: appRoot().build() });

			await waitFor(() => expect(openUpsellModal).not.toHaveBeenCalled());

			await act(() => currentOnSubmit({}));

			await waitFor(() => expect(openUpsellModal).not.toHaveBeenCalled());
		});
	});
});
