import type { CloudConfirmationPollData } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ContextType, ReactNode } from 'react';
import { useContext } from 'react';

import CloudAccountConfirmation from './CloudAccountConfirmation';
import { SetupWizardContext } from '../contexts/SetupWizardContext';

jest.mock('@rocket.chat/onboarding-ui', () => ({
	AwaitingConfirmationPage: ({ description, onResendEmailRequest }: { description?: ReactNode; onResendEmailRequest: () => void }) => (
		<>
			{description}
			<button type='button' onClick={onResendEmailRequest}>
				Resend email
			</button>
		</>
	),
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

const pendingPollData: CloudConfirmationPollData = { status: 'authorization_pending' };

type WizardProps = {
	deviceCode: string;
	completeCloudRegistration: () => Promise<void>;
	registerServer: ContextType<typeof SetupWizardContext>['registerServer'];
};

const WithWizard = ({ deviceCode, completeCloudRegistration, registerServer, children }: WizardProps & { children: ReactNode }) => {
	const defaults = useContext(SetupWizardContext);
	const value: ContextType<typeof SetupWizardContext> = {
		...defaults,
		setupWizardData: {
			...defaults.setupWizardData,
			registrationData: {
				device_code: deviceCode,
				user_code: 'USER-CODE',
				cloudEmail: 'admin@example.com',
				interval: POLL_INTERVAL_SECONDS,
			},
		},
		completeCloudRegistration,
		registerServer,
	};

	return <SetupWizardContext.Provider value={value}>{children}</SetupWizardContext.Provider>;
};

const renderStep = ({
	completeCloudRegistration,
	registerServer = jest.fn(async () => undefined),
	poll = jest.fn(async () => ({ pollData: confirmedPollData })),
	toast = jest.fn(),
}: {
	completeCloudRegistration: () => Promise<void>;
	registerServer?: WizardProps['registerServer'];
	poll?: jest.Mock;
	toast?: jest.Mock;
}) => {
	const view = (deviceCode: string) => (
		<WithWizard deviceCode={deviceCode} completeCloudRegistration={completeCloudRegistration} registerServer={registerServer}>
			<CloudAccountConfirmation />
		</WithWizard>
	);

	const { rerender } = render(view('device-code'), {
		wrapper: mockAppRoot().withToastMessageDispatch(toast).withEndpoint('GET', '/v1/cloud.confirmationPoll', poll).build(),
	});

	return { poll, toast, receiveNewRegistrationIntent: (deviceCode: string) => rerender(view(deviceCode)) };
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

	it('keeps polling until the registration is confirmed', async () => {
		const completeCloudRegistration = jest.fn(async () => undefined);
		const poll = jest
			.fn()
			.mockResolvedValueOnce({ pollData: pendingPollData })
			.mockResolvedValueOnce({ pollData: pendingPollData })
			.mockResolvedValue({ pollData: confirmedPollData });
		renderStep({ completeCloudRegistration, poll });

		await waitForPollTicks(5);

		expect(poll).toHaveBeenCalledTimes(3);
		expect(completeCloudRegistration).toHaveBeenCalledTimes(1);
	});

	it('stops polling once the registration is confirmed, while the completion is still pending', async () => {
		const completeCloudRegistration = jest.fn(() => new Promise<void>(() => undefined));
		const { poll } = renderStep({ completeCloudRegistration });

		await waitForPollTicks(4);

		expect(poll).toHaveBeenCalledTimes(1);
		expect(completeCloudRegistration).toHaveBeenCalledTimes(1);
	});

	it('does not retry a failed completion on its own', async () => {
		const completeCloudRegistration = jest.fn<Promise<void>, []>().mockRejectedValue(new Error('two-factor confirmation cancelled'));
		const { poll, toast } = renderStep({ completeCloudRegistration });

		await waitForPollTicks(4);

		expect(poll).toHaveBeenCalledTimes(1);
		expect(completeCloudRegistration).toHaveBeenCalledTimes(1);
		expect(toast).toHaveBeenCalledWith({ type: 'error', message: new Error('two-factor confirmation cancelled') });
		expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
	});

	it('retries a failed completion when the user asks to', async () => {
		const completeCloudRegistration = jest
			.fn<Promise<void>, []>()
			.mockRejectedValueOnce(new Error('two-factor confirmation cancelled'))
			.mockResolvedValue(undefined);
		renderStep({ completeCloudRegistration });

		await waitForPollTicks(1);

		fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
		await act(async () => {
			await jest.advanceTimersByTimeAsync(0);
		});

		expect(completeCloudRegistration).toHaveBeenCalledTimes(2);
		expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
	});

	it('polls for the new code after the confirmation email is resent', async () => {
		const completeCloudRegistration = jest.fn(() => new Promise<void>(() => undefined));
		const registerServer = jest.fn(async () => undefined);
		const { poll, receiveNewRegistrationIntent } = renderStep({ completeCloudRegistration, registerServer });

		await waitForPollTicks(2);
		expect(poll).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole('button', { name: 'Resend email' }));
		expect(registerServer).toHaveBeenCalledWith({ email: 'admin@example.com', resend: true });

		receiveNewRegistrationIntent('new-device-code');
		await waitForPollTicks(1);

		expect(poll).toHaveBeenCalledTimes(2);
		expect(poll).toHaveBeenLastCalledWith({ deviceCode: 'new-device-code' });
	});
});
