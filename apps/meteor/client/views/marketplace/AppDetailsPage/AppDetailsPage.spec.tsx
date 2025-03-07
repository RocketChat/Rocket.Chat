import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppDetailsPage from './AppDetailsPage';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import { useAppInfo } from '../hooks/useAppInfo';

jest.mock('../hooks/useAppInfo', () => ({
	useAppInfo: jest.fn(),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useTranslation: () => (key: string) => key,
	useRouter: () => ({ navigate: jest.fn() }),
	useToastMessageDispatch: () => jest.fn(),
	usePermission: () => true,
	useRouteParameter: jest.fn(() => null),
}));

jest.mock('../../../apps/orchestrator', () => ({
	AppClientOrchestratorInstance: {
		setAppSettings: jest.fn(),
	},
}));

describe('AppDetailsPage', () => {
	beforeEach(() => {
		(useAppInfo as jest.Mock).mockReturnValue({
			id: 'app123',
			name: 'Test App',
			installed: true,
			settings: {
				setting1: { id: 'setting1', value: 'old-value', packageValue: 'default-value' },
			},
			privacyPolicySummary: '',
			permissions: [],
			tosLink: '',
			privacyLink: '',
		});
		(AppClientOrchestratorInstance.setAppSettings as jest.Mock).mockReset();
	});

	it('should remove loading state on Save button, reset form, and hide the button after successful save', async () => {
		(AppClientOrchestratorInstance.setAppSettings as jest.Mock).mockResolvedValueOnce({});

		render(<AppDetailsPage id='app123' />);

		const saveButton = screen.getByRole('button', { name: /Save_changes/i });

		expect(saveButton).not.toBeDisabled();

		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(saveButton).toBeDisabled();
		});

		await waitFor(() => {
			expect(saveButton).not.toBeDisabled();
		});

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: /Save_changes/i })).not.toBeInTheDocument();
		});
	});
});
