import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let PrivateEmptyState: (typeof import('./PrivateEmptyState'))['default'];
describe('PrivateEmptyState', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-client'), {
			exports: {
				...require('@rocket.chat/ui-client'),
				useLicense: fn<FunctionLike>(),
			},
		});
		({ default: PrivateEmptyState } = require('./PrivateEmptyState'));
	});

	after(leaveModuleScope);

	describe('with private apps enabled', () => {
		beforeEach(async () => {
			const { useLicense } = await import('@rocket.chat/ui-client');
			(useLicense as Mock<FunctionLike>).mockReturnValue({
				data: {
					limits: {
						privateApps: {
							max: 5,
						},
					},
				},
				isPending: false,
			});
		});

		const appRoot = mockAppRoot().withTranslations('en', 'core', {
			Private_apps_upgrade_empty_state_title: 'Upgrade to unlock private apps',
			No_private_apps_installed: 'No private apps installed',
		});

		it('should offer to upgrade to unlock private apps', () => {
			render(<PrivateEmptyState />, { wrapper: appRoot.build() });

			expect(screen.getByRole('heading', { name: 'No private apps installed' })).toBeInTheDocument();
		});
	});

	describe('without private apps enabled', () => {
		beforeEach(async () => {
			const { useLicense } = await import('@rocket.chat/ui-client');
			(useLicense as Mock<FunctionLike>).mockReturnValue({
				data: {
					limits: {
						privateApps: {
							max: 0,
						},
					},
				},
				isPending: false,
			});
		});

		const appRoot = mockAppRoot().withTranslations('en', 'core', {
			Private_apps_upgrade_empty_state_title: 'Upgrade to unlock private apps',
			No_private_apps_installed: 'No private apps installed',
		});

		it('should offer to upgrade to unlock private apps', () => {
			render(<PrivateEmptyState />, { wrapper: appRoot.build() });

			expect(screen.getByRole('heading', { name: 'Upgrade to unlock private apps' })).toBeInTheDocument();
		});
	});
});
