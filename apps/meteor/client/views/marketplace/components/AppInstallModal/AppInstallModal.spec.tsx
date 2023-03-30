import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import type { ReactNode } from 'react';
import React from 'react';

import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import type * as AppInstallModal_model from './AppInstallModal';

describe('AppInstallModal', () => {
	const loadMock = () => {
		return proxyquire('./AppInstallModal', {
			'../../../hooks/useAppInstall': {
				useAppInstall: () => {
					return {
						appInstall: {
							app: App, // should it be App or should I created a fake app?
							status: 'pending',
						},
						installApp: spy(),
						uninstallApp: spy(),
					};
				},
			},
		}).default;
	};

	// TODO: change this test
	it('should render all apps options when a user has manage apps permission', async () => {
		const AppsModelList = loadMock();

		render(<AppsModelList onDismiss={() => null} appBoxItems={[]} appsManagementAllowed />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.getByText('Marketplace')).to.exist;
		expect(screen.getByText('Installed')).to.exist;
		expect(screen.getByText('Requested')).to.exist;
	});
});
