import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const COMPONENT_PATH = '../../../../../client/components/AdministrationList/AdministrationModelList';
const defaultConfig = {
	'../../../app/ui-utils/client': {
		'SideNav': {},
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
};

describe('components/AdministrationList/AdministrationModelList', () => {
	it('should render administration', async () => {
		const AdministrationModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
		render(<AdministrationModelList closeList={() => null} accountBoxItems={[]} showAdmin={true} />);

		expect(screen.getByText('Administration')).to.exist;
		expect(screen.getByText('Workspace')).to.exist;
		expect(screen.getByText('Upgrade')).to.exist;
	});

	it('should not render workspace and upgrade when does not have permission', async () => {
		const AdministrationModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
		render(<AdministrationModelList closeList={() => null} accountBoxItems={[]} showAdmin={false} />);

		expect(screen.getByText('Administration')).to.exist;
		expect(screen.queryByText('Workspace')).to.not.exist;
		expect(screen.queryByText('Upgrade')).to.not.exist;
	});

	context('when clicked', () => {
		it('should go to admin info', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const AdministrationModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AdministrationModelList closeList={closeList} accountBoxItems={[]} showAdmin={true} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Workspace');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-info'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should go to admin index if no permission', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const AdministrationModelList = proxyquire.load(COMPONENT_PATH, {
				...defaultConfig,
				'../../../app/authorization/client': {
					'userHasAllPermission': () => false,
					'@noCallThru': true,
				},
			}).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AdministrationModelList closeList={closeList} accountBoxItems={[]} showAdmin={true} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Workspace');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-index'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should call upgrade route', async () => {
			const closeList = spy();
			const pushRoute = spy();
			const AdministrationModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AdministrationModelList closeList={closeList} accountBoxItems={[]} showAdmin={true} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Upgrade');

			userEvent.click(button);

			await waitFor(() => expect(pushRoute).to.have.been.called.with('upgrade', { type: 'Upgrade' }, { trialEndDate: '2020-01-01' }));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should render admin box and call router', async () => {
			const router = spy();
			const closeList = spy();
			const AdministrationModelList = proxyquire.load(COMPONENT_PATH, {
				...defaultConfig,
				'meteor/kadira:flow-router': {
					'FlowRouter': {
						go: router,
					},
					'@noCallThru': true,
				},
			}).default;

			render(
				<AdministrationModelList closeList={closeList} accountBoxItems={[{ name: 'Admin Item', href: 'admin-item' }]} showAdmin={true} />,
			);

			const button = screen.getByText('Admin Item');

			userEvent.click(button);
			await waitFor(() => expect(router).to.have.been.called.with('admin-item'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should render admin box and call sidenav', async () => {
			const closeList = spy();
			const setFlex = spy();
			const openFlex = spy();
			const AdministrationModelList = proxyquire.load(COMPONENT_PATH, {
				...defaultConfig,
				'../../../app/ui-utils/client': {
					'SideNav': {
						setFlex,
						openFlex,
					},
					'@noCallThru': true,
				},
			}).default;
			render(
				<AdministrationModelList closeList={closeList} accountBoxItems={[{ name: 'Admin Item', sideNav: 'admin' }]} showAdmin={true} />,
			);
			const button = screen.getByText('Admin Item');

			userEvent.click(button);
			await waitFor(() => expect(setFlex).to.have.been.called.with('admin'));
			await waitFor(() => expect(openFlex).to.have.been.called());
			await waitFor(() => expect(closeList).to.have.been.called());
		});
	});
});
