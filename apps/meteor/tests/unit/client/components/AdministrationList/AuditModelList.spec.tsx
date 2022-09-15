import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import React from 'react';

import AuditModelList from '../../../../../client/components/AdministrationList/AuditModelList';
import RouterContextMock from '../../../../mocks/client/RouterContextMock';

describe('components/AdministrationList/AuditModelList', () => {
	it('should render audit', async () => {
		render(<AuditModelList showAudit={true} showAuditLog={true} closeList={() => null} />);

		expect(screen.getByText('Audit')).to.exist;
		expect(screen.getByText('Messages')).to.exist;
		expect(screen.getByText('Logs')).to.exist;
	});

	it('should not render messages and log when does not have permission', async () => {
		render(<AuditModelList showAudit={false} showAuditLog={false} closeList={() => null} />);

		expect(screen.getByText('Audit')).to.exist;
		expect(screen.queryByText('Messages')).to.not.exist;
		expect(screen.queryByText('Logs')).to.not.exist;
	});

	context('when clicked', () => {
		it('should go to audit home', async () => {
			const pushRoute = spy();
			const closeList = spy();
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AuditModelList showAudit={true} showAuditLog={false} closeList={closeList} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Messages');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('audit-home'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});

		it('should go to audit log', async () => {
			const pushRoute = spy();
			const closeList = spy();
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<AuditModelList showAudit={false} showAuditLog={true} closeList={closeList} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Logs');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('audit-log'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});
	});
});
