import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { NotFoundPage } from './NotFoundPage';
import RouterContextMock from './RouterContextMock';

describe('views/notFound/NotFoundPage', () => {
	it('should look good', async () => {
		render(<NotFoundPage />);

		expect(screen.getByRole('heading', { level: 1, name: 'Oops_page_not_found' })).toBeDefined();
		expect(
			screen.getByRole('status', {
				name: 'Sorry_page_you_requested_does_not_exist_or_was_deleted',
			}),
		).toBeDefined();
		const buttonReply = screen.getByRole('button', { name: 'Return_to_previous_page' });
		expect(buttonReply).toBeDefined();
		expect(buttonReply).not.toBeDisabled();
		const buttonHome = screen.getByRole('button', { name: 'Return_to_home' });
		expect(buttonHome).toBeDefined();
		expect(buttonHome).not.toBeDisabled();
	});

	it('should have correct tab order', () => {
		render(<NotFoundPage />);

		expect(document.body).toHaveFocus();
		userEvent.tab();
		expect(screen.getByRole('button', { name: 'Return_to_previous_page' })).toHaveFocus();
		userEvent.tab();
		expect(screen.getByRole('button', { name: 'Return_to_home' })).toHaveFocus();
		userEvent.tab();
		expect(document.body).toHaveFocus();
	});

	describe('"Return to previous page" button', () => {
		describe('when clicked', () => {
			const listener = jest.fn();

			beforeAll(() => {
				window.history.pushState('404-page', '', 'http://localhost:3000/404');
				window.addEventListener('popstate', listener);
			});

			afterAll(() => {
				window.removeEventListener('popstate', listener);
			});

			it('should go back on history', async () => {
				render(<NotFoundPage />);
				const button = screen.getByRole('button', { name: 'Return_to_previous_page' });

				userEvent.click(button);
				await waitFor(() => expect(listener).toBeCalled(), { timeout: 2000 });
				expect(window.history.state).not.toEqual('404-page');
			});
		});
	});

	describe('"Return to home" button', () => {
		describe('when clicked', () => {
			it('should go back on history', async () => {
				const pushRoute = jest.fn();
				render(
					<RouterContextMock pushRoute={pushRoute}>
						<NotFoundPage />
					</RouterContextMock>,
				);
				const button = screen.getByRole('button', { name: 'Return_to_home' });

				userEvent.click(button);
				await waitFor(() => expect(pushRoute).toBeCalledWith('home', undefined, undefined));
			});
		});
	});
});
