import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import type { ReactNode } from 'react';
import React from 'react';

import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import type * as AppsModelListModel from './AppsModelList';

describe('AppsModelList', () => {
	const loadMock = (stubs?: Record<string, unknown>) => {
		return proxyquire.noCallThru().load<typeof AppsModelListModel>('./AppsModelList', {
			'../../../app/ui-message/client/ActionManager': {
				triggerActionButtonAction: {},
			},
			...stubs,
		}).default;
	};

	it('should render apps', async () => {
		const AppsModelList = loadMock();

		render(<AppsModelList appsManagementAllowed onDismiss={() => null} appBoxItems={[]} />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.getByText('Marketplace')).to.exist;
		expect(screen.getByText('Installed')).to.exist;
	});

	it('should not render marketplace and installed when does not have permission', async () => {
		const AppsModelList = loadMock({
			'@rocket.chat/ui-contexts': {
				'useAtLeastOnePermission': (): boolean => false,
				'@noCallThru': false,
			},
		});

		render(<AppsModelList appsManagementAllowed={false} onDismiss={() => null} appBoxItems={[]} />);

		expect(screen.getByText('Apps')).to.exist;
		expect(screen.queryByText('Marketplace')).to.not.exist;
		expect(screen.queryByText('Installed')).to.not.exist;
	});

	context('when clicked', () => {
		const pushRoute = spy();
		const handleDismiss = spy();

		const ProvidersMock = ({ children }: { children: ReactNode }) => {
			return <RouterContextMock pushRoute={pushRoute}>{children}</RouterContextMock>;
		};

		it('should go to admin marketplace', async () => {
			const AppsModelList = loadMock();

			render(<AppsModelList appsManagementAllowed onDismiss={handleDismiss} appBoxItems={[]} />, { wrapper: ProvidersMock });

			const button = screen.getByText('Marketplace');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-marketplace'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should go to installed', async () => {
			const AppsModelList = loadMock();

			render(<AppsModelList appsManagementAllowed onDismiss={handleDismiss} appBoxItems={[]} />, { wrapper: ProvidersMock });

			const button = screen.getByText('Installed');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-marketplace', { context: 'installed', page: 'list' }));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should render apps and trigger action', async () => {
			const triggerActionButtonAction = spy();

			const AppsModelList = loadMock({
				'../../../app/ui-message/client/ActionManager': {
					triggerActionButtonAction,
					'@noCallThru': true,
				},
			});

			render(<AppsModelList appsManagementAllowed onDismiss={handleDismiss} appBoxItems={[{ name: 'Custom App' } as any]} />, {
				wrapper: ProvidersMock,
			});

			const button = screen.getByText('Custom App');

			userEvent.click(button);
			await waitFor(() => expect(triggerActionButtonAction).to.have.been.called());
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});
	});
});
