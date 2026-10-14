import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import type { ReactNode } from 'react';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let AppDetailsPage: (typeof import('./AppDetailsPage'))['default'];
let AppClientOrchestratorInstance: (typeof import('../../../apps/orchestrator'))['AppClientOrchestratorInstance'];
let useAppInfo: (typeof import('../hooks/useAppInfo'))['useAppInfo'];

const wrapper = mockAppRoot().withTranslations('en', 'core', { Save_changes: 'Save changes' });

describe('AppDetailsPage', () => {
	before(() => {
		enterModuleScope();
		mock.module('../hooks/useAppInfo', {
			exports: {
				useAppInfo: fn<FunctionLike>(),
			},
		});
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				default: (() => {
					const originalModule = require('@rocket.chat/ui-contexts');
					return {
						...originalModule,
						useRouter: () => ({ navigate: fn<FunctionLike>() }),
						useToastMessageDispatch: () => fn<FunctionLike>(),
						usePermission: () => true,
						useRouteParameter: () => 'settings',
					};
				})(),
			},
		});
		mock.module(require.resolve('@rocket.chat/ui-client'), {
			exports: {
				default: (() => {
					const originalModule = require('@rocket.chat/ui-client');
					return {
						...originalModule,
						PageHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
						PageFooter: ({ children, isDirty }: { children: ReactNode; isDirty: boolean }) => isDirty && <div>{children}</div>,
					};
				})(),
			},
		});
		mock.module('./AppDetailsPageHeader', {
			exports: {
				default: {
					__esModule: true,
					default: () => <div>AppDetailsPageHeader</div>,
				},
			},
		});
		mock.module('../../../apps/orchestrator', {
			exports: {
				AppClientOrchestratorInstance: {
					setAppSettings: fn<FunctionLike>(),
				},
			},
		});
		({ default: AppDetailsPage } = require('./AppDetailsPage'));
		({ AppClientOrchestratorInstance } = require('../../../apps/orchestrator'));
		({ useAppInfo } = require('../hooks/useAppInfo'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		(useAppInfo as Mock<FunctionLike>).mockReturnValue({
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
		(AppClientOrchestratorInstance.setAppSettings as Mock<FunctionLike>).mockReset();
	});

	it('should not display the Save button initially', async () => {
		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
		});

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
		});
	});

	it('should display the Save button when a setting is changed', async () => {
		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
		});

		const settingInput = screen.getByLabelText('setting1');
		await userEvent.clear(settingInput);
		await userEvent.type(settingInput, 'new-value');

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeVisible();
		});
	});

	it('should disable the Save button during submission', async () => {
		(AppClientOrchestratorInstance.setAppSettings as Mock<FunctionLike>).mockResolvedValueOnce(
			new Promise((resolve) => setTimeout(resolve, 500)),
		);

		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
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
		(AppClientOrchestratorInstance.setAppSettings as Mock<FunctionLike>).mockResolvedValueOnce(
			new Promise((resolve) => setTimeout(resolve, 500)),
		);

		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
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
		(AppClientOrchestratorInstance.setAppSettings as Mock<FunctionLike>).mockResolvedValueOnce(
			new Promise((resolve) => setTimeout(resolve, 500)),
		);

		render(<AppDetailsPage id='app123' />, {
			wrapper: wrapper.build(),
		});

		const settingInput = screen.getByLabelText('setting1');
		await userEvent.clear(settingInput);
		await userEvent.type(settingInput, 'new-value');

		const saveButton = screen.getByRole('button', { name: 'Save changes' });
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(AppClientOrchestratorInstance.setAppSettings as Mock<FunctionLike>).toHaveBeenCalledWith('app123', [
				{ id: 'setting1', packageValue: 'default-value', type: 'string', value: 'new-value' },
			]);
		});
	});
});
