import { render, screen } from '@testing-library/react';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

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
