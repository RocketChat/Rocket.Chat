import type { CloudConfirmationPollData } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render } from '@testing-library/react';
import type { ContextType, ReactNode } from 'react';
import { useContext } from 'react';

import CloudAccountConfirmation from './CloudAccountConfirmation';
import { SetupWizardContext } from '../contexts/SetupWizardContext';

jest.mock('@rocket.chat/onboarding-ui', () => ({
	AwaitingConfirmationPage: () => null,
}));

const POLL_INTERVAL_SECONDS = 5;

const confirmedPollData: CloudConfirmationPollData = {
	successful: true,
	payload: {
		workspaceId: 'workspace-id',
		client_name: 'client',
		client_id: 'client-id',
		client_secret: 'client-secret',
		redirect_uris: [],
		publicKey: 'public-key',
		client_secret_expires_at: 0,
		registration_client_uri: 'https://cloud.example/registration',
		licenseData: {
			version: 3,
			address: 'https://workspace.example',
			license: 'license',
			updatedAt: '2026-09-15T00:00:00.000Z',
			expireAt: '2027-09-15T00:00:00.000Z',
		},
	},
};

const WithWizard = ({ overrides, children }: { overrides: Partial<ContextType<typeof SetupWizardContext>>; children: ReactNode }) => {
	const defaults = useContext(SetupWizardContext);

	return (
		<SetupWizardContext.Provider
			value={{
				...defaults,
				setupWizardData: {
					...defaults.setupWizardData,
					registrationData: {
						device_code: 'device-code',
						user_code: 'USER-CODE',
						cloudEmail: 'admin@example.com',
						interval: POLL_INTERVAL_SECONDS,
					},
				},
				...overrides,
			}}
		>
			{children}
		</SetupWizardContext.Provider>
	);
};

const renderStep = ({
	completeCloudRegistration,
	toast = jest.fn(),
}: {
	completeCloudRegistration: () => Promise<void>;
	toast?: jest.Mock;
}) => {
	const poll = jest.fn(async () => ({ pollData: confirmedPollData }));

	render(
		<WithWizard overrides={{ completeCloudRegistration }}>
			<CloudAccountConfirmation />
		</WithWizard>,
		{
			wrapper: mockAppRoot().withToastMessageDispatch(toast).withEndpoint('GET', '/v1/cloud.confirmationPoll', poll).build(),
		},
	);

	return { poll, toast };
};

const waitForPollTicks = (ticks: number) =>
	act(async () => {
		await jest.advanceTimersByTimeAsync(POLL_INTERVAL_SECONDS * 1000 * ticks);
	});

describe('CloudAccountConfirmation', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('does not poll again or re-run the completion while a confirmed registration is still being completed', async () => {
		const completeCloudRegistration = jest.fn(() => new Promise<void>(() => undefined));
		const { poll } = renderStep({ completeCloudRegistration });

		await waitForPollTicks(4);

		expect(poll).toHaveBeenCalledTimes(1);
		expect(completeCloudRegistration).toHaveBeenCalledTimes(1);
	});

	it('reports a failed completion and tries again on the next poll', async () => {
		const completeCloudRegistration = jest
			.fn<Promise<void>, []>()
			.mockRejectedValueOnce(new Error('two-factor confirmation cancelled'))
			.mockResolvedValue(undefined);
		const { poll, toast } = renderStep({ completeCloudRegistration });

		await waitForPollTicks(1);

		expect(toast).toHaveBeenCalledWith({ type: 'error', message: new Error('two-factor confirmation cancelled') });

		await waitForPollTicks(1);

		expect(poll).toHaveBeenCalledTimes(2);
		expect(completeCloudRegistration).toHaveBeenCalledTimes(2);
	});
});
