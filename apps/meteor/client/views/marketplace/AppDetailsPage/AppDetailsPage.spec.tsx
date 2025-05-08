import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppDetailsPage from './AppDetailsPage';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import { useAppInfo } from '../hooks/useAppInfo';

jest.mock('../hooks/useAppInfo', () => ({
	useAppInfo: jest.fn(),
}));

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...originalModule,
		useRouter: () => ({ navigate: jest.fn() }),
		useToastMessageDispatch: () => jest.fn(),
		usePermission: () => true,
		useRouteParameter: () => 'settings',
	};
});

jest.mock('../../../components/Page', () => {
	const originalModule = jest.requireActual('../../../components/Page');
	return {
		...originalModule,
		PageHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		PageFooter: ({ children, isDirty }: { children: React.ReactNode; isDirty: boolean }) => isDirty && <div>{children}</div>,
	};
});

jest.mock('./AppDetailsPageHeader', () => ({
	__esModule: true,
	default: () => <div>AppDetailsPageHeader</div>,
}));

jest.mock('../../../apps/orchestrator', () => ({
	AppClientOrchestratorInstance: {
		setAppSettings: jest.fn(),
	},
}));

const wrapper = mockAppRoot().withTranslations('en', 'core', { Save_changes: 'Save changes' });
describe('AppDetailsPage', () => {
	beforeEach(() => {
		(useAppInfo as jest.Mock).mockReturnValue({
			id: 'app123',
			name: 'Test App',
			installed: true,
			settings: {
				setting1: { id: 'setting1', value: 'old-value', packageValue: 'default-value', type: 'string' },
			},
			privacyPolicySummary: '',
			permissions: [],
			tosLink: '',
			privacyLink: '',
		});
		(AppClientOrchestratorInstance.setAppSettings as jest.Mock).mockReset();
	});

	it('should not display the Save button initially', async () => {
		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
			legacyRoot: true,
		});

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
		});
	});

	it('should display the Save button when a setting is changed', async () => {
		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
			legacyRoot: true,
		});

		const settingInput = screen.getByLabelText('setting1');
		await userEvent.clear(settingInput);
		await userEvent.type(settingInput, 'new-value');

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeVisible();
		});
	});

	it('should disable the Save button during submission', async () => {
		(AppClientOrchestratorInstance.setAppSettings as jest.Mock).mockResolvedValueOnce(new Promise((resolve) => setTimeout(resolve, 500)));

		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
			legacyRoot: true,
		});

		const settingInput = screen.getByLabelText('setting1');
		await userEvent.clear(settingInput);
		await userEvent.type(settingInput, 'new-value');

		const saveButton = screen.getByRole('button', { name: 'Save changes' });

		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(saveButton).toBeDisabled();
		});
	});

	it('should hide the Save button after successful save', async () => {
		(AppClientOrchestratorInstance.setAppSettings as jest.Mock).mockResolvedValueOnce(new Promise((resolve) => setTimeout(resolve, 500)));

		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
			legacyRoot: true,
		});

		const settingInput = screen.getByLabelText('setting1');
		await userEvent.clear(settingInput);
		await userEvent.type(settingInput, 'new-value');

		const saveButton = screen.getByRole('button', { name: 'Save changes' });
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
		});
	});

	it('should call setAppSettings with updated setting value', async () => {
		(AppClientOrchestratorInstance.setAppSettings as jest.Mock).mockResolvedValueOnce(new Promise((resolve) => setTimeout(resolve, 500)));

		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
			legacyRoot: true,
		});

		const settingInput = screen.getByLabelText('setting1');
		await userEvent.clear(settingInput);
		await userEvent.type(settingInput, 'new-value');

		const saveButton = screen.getByRole('button', { name: 'Save changes' });
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(AppClientOrchestratorInstance.setAppSettings as jest.Mock).toHaveBeenCalledWith('app123', [
				{ id: 'setting1', packageValue: 'default-value', type: 'string', value: 'new-value' },
			]);
		});
	});
});
