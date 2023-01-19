import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const mockAppsModelListModule = (stubs = {}) => {
	return proxyquire.load('../../../../../client/components/AdministrationList/AppsModelList', {
		'../../../app/ui-message/client/ActionManager': {
			'triggerActionButtonAction': {},
			'@noCallThru': true,
		},
		...stubs,
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	}) as typeof import('../../../../../client/components/AdministrationList/AppsModelList');
};

describe('components/AdministrationList/AppsModelList', () => {
	it('should render apps', async () => {
		const AppsModelList = mockAppsModelListModule().default;
		render(<AppsModelList onDismiss={() => null} appBoxItems={[]} />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.getByText('Marketplace')).to.exist;
		expect(screen.getByText('Installed')).to.exist;
	});

	context('when clicked', () => {
		it('should go to marketplace', async () => {
			const pushRoute = spy();
			const handleDismiss = spy();
			const AppsModelList = mockAppsModelListModule().default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList onDismiss={handleDismiss} appBoxItems={[]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Marketplace');
			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('marketplace', { context: 'explore', page: 'list' }));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should go to installed', async () => {
			const pushRoute = spy();
			const handleDismiss = spy();
			const AppsModelList = mockAppsModelListModule().default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList onDismiss={handleDismiss} appBoxItems={[]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Installed');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('marketplace', { context: 'installed', page: 'list' }));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should render apps and trigger action', async () => {
			const pushRoute = spy();
			const handleDismiss = spy();
			const triggerActionButtonAction = spy();
			const AppsModelList = mockAppsModelListModule({
				'../../../app/ui-message/client/ActionManager': {
					triggerActionButtonAction,
					'@noCallThru': true,
				},
			}).default;
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AppsModelList onDismiss={handleDismiss} appBoxItems={[{ name: 'Custom App' } as any]} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Custom App');

			userEvent.click(button);
			await waitFor(() => expect(triggerActionButtonAction).to.have.been.called());
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});
	});
});
