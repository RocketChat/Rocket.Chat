import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const mockAdministrationModelListModule = (stubs = {}) => {
	return proxyquire.load('../../../../../client/components/AdministrationList/AdministrationModelList', {
		'../../../app/ui-utils/client': {
			'@noCallThru': true,
		},
		'meteor/kadira:flow-router': {
			'FlowRouter': {},
			'@noCallThru': true,
		},
		'../../views/hooks/useUpgradeTabParams': {
			'useUpgradeTabParams': () => ({
				isLoading: false,
				tabType: 'Upgrade',
				trialEndDate: '2020-01-01',
			}),
			'@noCallThru': true,
		},
		'../../../lib/upgradeTab': {
			getUpgradeTabLabel: () => 'Upgrade',
			isFullyFeature: () => true,
		},
		'../../../app/authorization/client': {
			'userHasAllPermission': () => true,
			'@noCallThru': true,
		},
		...stubs,
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	}) as typeof import('../../../../../client/components/AdministrationList/AdministrationModelList');
};

describe('components/AdministrationList/AdministrationModelList', () => {
	it('should render administration', async () => {
		const AdministrationModelList = mockAdministrationModelListModule().default;
		render(<AdministrationModelList accountBoxItems={[]} showWorkspace={true} onDismiss={() => null} />);

		expect(screen.getByText('Administration')).to.exist;
		expect(screen.getByText('Workspace')).to.exist;
		expect(screen.getByText('Upgrade')).to.exist;
	});

	it('should not render workspace', async () => {
		const AdministrationModelList = mockAdministrationModelListModule().default;
		render(<AdministrationModelList accountBoxItems={[]} showWorkspace={false} onDismiss={() => null} />);

		expect(screen.getByText('Administration')).to.exist;
		expect(screen.queryByText('Workspace')).to.not.exist;
		expect(screen.getByText('Upgrade')).to.exist;
	});

	context('when clicked', () => {
		it('should go to admin info', async () => {
			const pushRoute = spy();
			const handleDismiss = spy();
			const AdministrationModelList = mockAdministrationModelListModule().default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AdministrationModelList accountBoxItems={[]} showWorkspace={true} onDismiss={handleDismiss} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Workspace');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-info'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should go to admin index if no permission', async () => {
			const pushRoute = spy();
			const handleDismiss = spy();
			const AdministrationModelList = mockAdministrationModelListModule({
				'../../../app/authorization/client': {
					'userHasAllPermission': () => false,
					'@noCallThru': true,
				},
			}).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AdministrationModelList accountBoxItems={[]} showWorkspace={true} onDismiss={handleDismiss} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Workspace');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-index'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should call upgrade route', async () => {
			const handleDismiss = spy();
			const pushRoute = spy();
			const AdministrationModelList = mockAdministrationModelListModule().default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AdministrationModelList accountBoxItems={[]} showWorkspace={false} onDismiss={handleDismiss} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Upgrade');

			userEvent.click(button);

			await waitFor(() => expect(pushRoute).to.have.been.called.with('upgrade', { type: 'Upgrade' }, { trialEndDate: '2020-01-01' }));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should render admin box and call router', async () => {
			const router = spy();
			const handleDismiss = spy();
			const AdministrationModelList = mockAdministrationModelListModule({
				'meteor/kadira:flow-router': {
					'FlowRouter': {
						go: router,
					},
					'@noCallThru': true,
				},
			}).default;

			render(
				<AdministrationModelList
					accountBoxItems={[{ name: 'Admin Item', href: 'admin-item' } as any]}
					showWorkspace={false}
					onDismiss={handleDismiss}
				/>,
			);

			const button = screen.getByText('Admin Item');

			userEvent.click(button);
			await waitFor(() => expect(router).to.have.been.called.with('admin-item'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should render admin box and call sidenav', async () => {
			const handleDismiss = spy();
			const AdministrationModelList = mockAdministrationModelListModule().default;
			render(
				<AdministrationModelList
					accountBoxItems={[{ name: 'Admin Item', sideNav: 'admin' } as any]}
					showWorkspace={false}
					onDismiss={handleDismiss}
				/>,
			);
			const button = screen.getByText('Admin Item');

			userEvent.click(button);
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});
	});
});
