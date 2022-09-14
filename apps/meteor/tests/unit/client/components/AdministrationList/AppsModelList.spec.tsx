import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const COMPONENT_PATH = '../../../../../client/components/AdministrationList/AppsModelList';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useAtLeastOnePermission: (): boolean => true,
	},
	'../../../app/ui-message/client/ActionManager': {
		'triggerActionButtonAction': {},
		'@noCallThru': true,
	},
};

describe('components/AdministrationList/AppsModelList', () => {
	it('should render apps', async () => {
		const AppsModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
		render(<AppsModelList closeList={() => null} appBoxItems={[]} />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.getByText('Marketplace')).to.exist;
		expect(screen.getByText('Installed')).to.exist;
	});

	it('should not render marketplace and installed when does not have permission', async () => {
		const AppsModelList = proxyquire.load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: (): boolean => false,
			},
		}).default;
		render(<AppsModelList closeList={() => null} appBoxItems={[]} />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.queryByText('Marketplace')).to.not.exist;
		expect(screen.queryByText('Installed')).to.not.exist;
	});

	context('when clicked', () => {
		it('should go to admin marketplace', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const AppsModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList closeList={closeList} appBoxItems={[]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Marketplace');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-marketplace'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should go to installed', async () => {
			const pushRoute = spy();
			const closeList = spy();
			const AppsModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList closeList={closeList} appBoxItems={[]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Installed');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-marketplace', { context: 'installed' }));
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
					<AppsModelList closeList={closeList} appBoxItems={[{ name: 'Custom App' }]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Custom App');

			userEvent.click(button);
			await waitFor(() => expect(triggerActionButtonAction).to.have.been.called());
			await waitFor(() => expect(closeList).to.have.been.called());
		});
	});
});
