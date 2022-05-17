import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import React from 'react';

import RouterContextMock from '../../../../mocks/client/RouterContextMock';
import NotFoundPage from '../../../../../client/views/notFound/NotFoundPage';

// TODO: this is broken due to dependency (`react`) resolution tied to hoisted `node_modules`
describe.skip('views/notFound/NotFoundPage', () => {
	it('should look good', async () => {
		render(<NotFoundPage />);

		expect(screen.getByRole('heading', { level: 1, name: 'Oops_page_not_found' })).to.exist;
		expect(
			screen.getByRole('status', {
				name: 'Sorry_page_you_requested_does_not_exist_or_was_deleted',
			}),
		).to.exist;
		expect(screen.getByRole('button', { name: 'Return_to_previous_page' })).to.exist.and.to.not.match(':disabled');
		expect(screen.getByRole('button', { name: 'Return_to_home' })).to.exist.and.to.not.match(':disabled');
	});

	it('should have correct tab order', () => {
		render(<NotFoundPage />);

		expect(document.body).to.have.focus;
		userEvent.tab();
		expect(screen.getByRole('button', { name: 'Return_to_previous_page' })).to.have.focus;
		userEvent.tab();
		expect(screen.getByRole('button', { name: 'Return_to_home' })).to.have.focus;
		userEvent.tab();
		expect(document.body).to.have.focus;
	});

	context('"Return to previous page" button', () => {
		context('when clicked', () => {
			const listener = spy();

			before(() => {
				window.history.pushState('404-page', '', 'http://localhost:3000/404');
				window.addEventListener('popstate', listener);
			});

			after(() => {
				window.removeEventListener('popstate', listener);
			});

			it('should go back on history', async () => {
				render(<NotFoundPage />);
				const button = screen.getByRole('button', { name: 'Return_to_previous_page' });

				userEvent.click(button);
				await waitFor(() => expect(listener).to.have.been.called(), { timeout: 2000 });
				expect(window.history.state).to.not.be.eq('404-page');
			});
		});
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
				const button = screen.getByRole('button', { name: 'Return_to_home' });

				userEvent.click(button);
				await waitFor(() => expect(pushRoute).to.have.been.called.with('home'));
			});
		});
	});
});
