import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';
import NotFoundPage from '../../../../../client/views/notFound/NotFoundPage';

describe('views/notFound/NotFoundPage', () => {
	it('should look good', async () => {
		render(<NotFoundPage />);

		expect(screen.getByText('Page_not_found')).to.exist;
		expect(screen.getByText('Page_not_exist_or_not_permission')).to.exist;
		expect(screen.getByRole('button', { name: 'Homepage' })).to.exist.and.to.not.match(':disabled');
	});

	it('should have correct tab order', () => {
		render(<NotFoundPage />);

		expect(document.body).to.have.focus;
		userEvent.tab();
		expect(screen.getByRole('button', { name: 'Homepage' })).to.have.focus;
		userEvent.tab();
		expect(document.body).to.have.focus;
	});

	context('"Return to home" button', () => {
		context('when clicked', () => {
			it('should go back on history', async () => {
				const pushRoute = spy();
				render(
					<RouterContextMock pushRoute={pushRoute}>
						<NotFoundPage />
					</RouterContextMock>,
				);
				const button = screen.getByRole('button', { name: 'Homepage' });

				userEvent.click(button);
				await waitFor(() => expect(pushRoute).to.have.been.called.with('home'));
			});
		});
	});
});
