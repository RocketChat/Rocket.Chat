import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SettingsContextValue } from '@rocket.chat/ui-contexts';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { act, render } from '@testing-library/react';
import type { ContextType, ReactNode } from 'react';
import { useContext } from 'react';

import SetupWizardProvider from './SetupWizardProvider';
import type { SetupWizardContext } from '../contexts/SetupWizardContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const WithSettingsDispatch = ({ dispatch, children }: { dispatch: SettingsContextValue['dispatch']; children: ReactNode }) => {
	const settings = useContext(SettingsContext);

	return <SettingsContext.Provider value={{ ...settings, dispatch }}>{children}</SettingsContext.Provider>;
};

const deferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>((settle) => {
		resolve = settle;
	});

	return { promise, resolve };
};

const renderProvider = ({ dispatch, toast = jest.fn() }: { dispatch: SettingsContextValue['dispatch']; toast?: jest.Mock }) => {
	let wizard: ContextType<typeof SetupWizardContext> | undefined;

	const CaptureWizard = () => {
		wizard = useSetupWizardContext();
		return null;
	};

	render(
		<WithSettingsDispatch dispatch={dispatch}>
			<SetupWizardProvider>
				<CaptureWizard />
			</SetupWizardProvider>
		</WithSettingsDispatch>,
		{
			wrapper: mockAppRoot()
				.withToastMessageDispatch(toast)
				.withEndpoint('GET', '/v1/setupWizard.parameters', () => ({ settings: [], serverAlreadyRegistered: false }))
				.build(),
		},
	);

	if (!wizard) {
		throw new Error('SetupWizardProvider did not render its children');
	}

	return { wizard, toast };
};

describe('SetupWizardProvider', () => {
	describe('completeCloudRegistration', () => {
		it('saves the workspace data and completes the wizard in a single settings request', async () => {
			const request = deferred();
			const dispatch = jest.fn<Promise<void>, Parameters<SettingsContextValue['dispatch']>>(() => request.promise);
			const { wizard, toast } = renderProvider({ dispatch });

			let completion: Promise<void> | undefined;
			act(() => {
				completion = wizard.completeCloudRegistration();
			});

			expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));

			await act(async () => {
				request.resolve();
				await completion;
			});

			expect(dispatch).toHaveBeenCalledTimes(1);
			expect(dispatch.mock.calls[0][0]).toEqual(
				expect.arrayContaining([
					{ _id: 'Register_Server', value: true },
					{ _id: 'Allow_Marketing_Emails', value: false },
					{ _id: 'Cloud_Service_Agree_PrivacyTerms', value: false },
					{ _id: 'Show_Setup_Wizard', value: 'completed' },
				]),
			);
			expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
		});

		it('does not report success when the settings request fails', async () => {
			const dispatch = jest.fn<Promise<void>, Parameters<SettingsContextValue['dispatch']>>().mockRejectedValue(new Error('totp-invalid'));
			const { wizard, toast } = renderProvider({ dispatch });

			await expect(act(() => wizard.completeCloudRegistration())).rejects.toThrow('totp-invalid');

			expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
		});
	});

	describe('completeSetupWizard', () => {
		it('reports success only after the wizard is marked as completed', async () => {
			const request = deferred();
			const dispatch = jest.fn<Promise<void>, Parameters<SettingsContextValue['dispatch']>>(() => request.promise);
			const { wizard, toast } = renderProvider({ dispatch });

			let completion: Promise<void> | undefined;
			act(() => {
				completion = wizard.completeSetupWizard();
			});

			expect(dispatch).toHaveBeenCalledWith([{ _id: 'Show_Setup_Wizard', value: 'completed' }]);
			expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));

			await act(async () => {
				request.resolve();
				await completion;
			});

			expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
		});

		it('reports the error instead of success when marking the wizard as completed fails', async () => {
			const dispatch = jest.fn<Promise<void>, Parameters<SettingsContextValue['dispatch']>>().mockRejectedValue(new Error('totp-invalid'));
			const { wizard, toast } = renderProvider({ dispatch });

			await act(() => wizard.completeSetupWizard());

			expect(toast).toHaveBeenCalledWith({ type: 'error', message: new Error('totp-invalid') });
			expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
		});
	});
});
