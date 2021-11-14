import { render, fireEvent, waitFor } from '@testing-library/react';
import { expect, spy } from 'chai';
import React from 'react';

import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import NotFoundPage from './NotFoundPage';

describe('views/notFound/NotFoundPage', () => {
	it('should look good', async () => {
		const { getByRole } = render(<NotFoundPage />);

		expect(getByRole('heading', { level: 1, name: 'Oops_page_not_found' })).to.be.visible;
		expect(
			getByRole('status', {
				name: 'Sorry_page_you_requested_does_not_exist_or_was_deleted',
			}),
		).to.be.visible;
	});

	context('"Return to previous page" button', () => {
		it('is visible', () => {
			const { getByRole } = render(<NotFoundPage />);
			expect(getByRole('button', { name: 'Return_to_previous_page' })).to.be.visible;
		});

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
				const { getByRole } = render(<NotFoundPage />);
				const button = getByRole('button', { name: 'Return_to_previous_page' });

				fireEvent.click(button);
				await waitFor(() => expect(listener).to.have.been.called(), { timeout: 2000 });
				expect(window.history.state).to.not.be.eq('404-page');
			});
		});
	});

	context('"Return to home" button', () => {
		it('is visible', () => {
			const { getByRole } = render(<NotFoundPage />);
			expect(getByRole('button', { name: 'Return_to_home' })).to.be.visible;
		});

		context('when clicked', () => {
			it('should go back on history', async () => {
				const pushRoute = spy();
				const { getByRole } = render(
					<RouterContextMock pushRoute={pushRoute}>
						<NotFoundPage />
					</RouterContextMock>,
				);
				const button = getByRole('button', { name: 'Return_to_home' });

				fireEvent.click(button);
				await waitFor(() => expect(pushRoute).to.have.been.called.with('home'));
			});
		});
	});
});
