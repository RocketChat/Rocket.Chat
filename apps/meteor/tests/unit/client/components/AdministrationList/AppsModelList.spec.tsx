import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const COMPONENT_PATH = '../../../../../client/components/AdministrationList/AppsModelList';
const defaultConfig = {
	'../../../app/ui-message/client/ActionManager': {
		'triggerActionButtonAction': {},
		'@noCallThru': true,
	},
};

describe('components/AdministrationList/AppsModelList', () => {
	it('should render apps', async () => {
		const AppsModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
		render(<AppsModelList showManageApps={true} closeList={() => null} appBoxItems={[]} />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.getByText('Marketplace')).to.exist;
		expect(screen.getByText('Installed')).to.exist;
	});

	context('when clicked', () => {
		it('should go to marketplace', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const AppsModelList = proxyquire.load(COMPONENT_PATH, {
				'@rocket.chat/ui-contexts': {
					useAtLeastOnePermission: () => false,
				},
				...defaultConfig,
			}).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList closeList={closeList} appBoxItems={[]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Marketplace');
			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('marketplace-all', { context: 'all', page: 'list' }));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should go to installed', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const AppsModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList showManageApps={true} closeList={closeList} appBoxItems={[]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Installed');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('marketplace-all', { context: 'installed', page: 'list' }));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should render apps and trigger action', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const triggerActionButtonAction = spy();
			const AppsModelList = proxyquire.load(COMPONENT_PATH, {
				...defaultConfig,
				'../../../app/ui-message/client/ActionManager': {
					triggerActionButtonAction,
					'@noCallThru': true,
				},
			}).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList showManageApps={true} closeList={closeList} appBoxItems={[{ name: 'Custom App' }]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Custom App');

			userEvent.click(button);
			await waitFor(() => expect(triggerActionButtonAction).to.have.been.called());
			await waitFor(() => expect(closeList).to.have.been.called());
		});
	});
});
