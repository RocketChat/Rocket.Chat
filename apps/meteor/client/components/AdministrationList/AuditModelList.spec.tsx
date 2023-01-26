import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import type { ReactNode } from 'react';
import React from 'react';

import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import AuditModelList from './AuditModelList';

describe('AuditModelList', () => {
	it('should render audit', async () => {
		render(<AuditModelList showAudit={true} showAuditLog={true} onDismiss={() => null} />);

		expect(screen.getByText('Audit')).to.exist;
		expect(screen.getByText('Messages')).to.exist;
		expect(screen.getByText('Logs')).to.exist;
	});

	it('should not render messages and log when does not have permission', async () => {
		render(<AuditModelList showAudit={false} showAuditLog={false} onDismiss={() => null} />);

		expect(screen.getByText('Audit')).to.exist;
		expect(screen.queryByText('Messages')).to.not.exist;
		expect(screen.queryByText('Logs')).to.not.exist;
	});

	context('when clicked', () => {
		const pushRoute = spy();
		const handleDismiss = spy();

		const ProvidersMock = ({ children }: { children: ReactNode }) => (
			<RouterContextMock pushRoute={pushRoute}>{children}</RouterContextMock>
		);

		it('should go to audit home', async () => {
			render(<AuditModelList showAudit={true} showAuditLog={false} onDismiss={handleDismiss} />, { wrapper: ProvidersMock });

			const button = screen.getByText('Messages');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('audit-home'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should go to audit log', async () => {
			render(<AuditModelList showAudit={false} showAuditLog={true} onDismiss={handleDismiss} />, { wrapper: ProvidersMock });

			const button = screen.getByText('Logs');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('audit-log'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});
	});
});
