import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';

const COMPONENT_PATH = '../../../../../client/components/AdministrationList/AuditModelList';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useAtLeastOnePermission: (): boolean => true,
	},
};

describe('components/AdministrationList/AuditModelList', () => {
	it('should render audit', async () => {
		const AuditModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
		render(<AuditModelList closeList={() => null} />);

		expect(screen.getByText('Audit')).to.exist;
		expect(screen.getByText('Messages')).to.exist;
		expect(screen.getByText('Logs')).to.exist;
	});

	it('should not render messages and log when does not have permission', async () => {
		const AuditModelList = proxyquire.load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: (): boolean => false,
			},
		}).default;
		render(<AuditModelList closeList={() => null} />);

		expect(screen.getByText('Audit')).to.exist;
		expect(screen.queryByText('Messages')).to.not.exist;
		expect(screen.queryByText('Logs')).to.not.exist;
	});

	context('when clicked', () => {
		it('should go to audit home', async () => {
			const AuditModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			const pushRoute = spy();
			const closeList = spy();
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AuditModelList closeList={closeList} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Messages');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('audit-home'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should go to audit log', async () => {
			const AuditModelList = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
			const pushRoute = spy();
			const closeList = spy();
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AuditModelList closeList={closeList} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Logs');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('audit-log'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});
	});
});
