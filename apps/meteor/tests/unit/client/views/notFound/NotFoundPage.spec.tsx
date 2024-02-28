import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { MutableRefObject } from 'react';
import React from 'react';

import NotFoundPage from '../../../../../client/views/notFound/NotFoundPage';
import RouterContextMock from '../../../../mocks/client/RouterContextMock';

describe('views/notFound/NotFoundPage', () => {
	it('should look good', async () => {
		render(<NotFoundPage />);

		await screen.findByRole('heading');

		expect(screen.getByRole('heading')).toHaveTextContent('Page_not_found');

		expect(screen.getByRole('button', { name: 'Homepage' })).not.toBeDisabled();
	});

	it('should have correct tab order', () => {
		render(<NotFoundPage />);
		// eslint-disable-next-line testing-library/no-node-access
		expect(document.activeElement).toBe(document.body);
		userEvent.tab();
		// eslint-disable-next-line testing-library/no-node-access
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Homepage' }));
		userEvent.tab();
		// eslint-disable-next-line testing-library/no-node-access
		expect(document.activeElement).toBe(document.body);
	});

	describe('"Return to home" button', () => {
		describe('when clicked', () => {
			it('should go back on history', async () => {
				const currentPath: MutableRefObject<string | undefined> = { current: undefined };

				render(
					<RouterContextMock currentPath={currentPath}>
						<NotFoundPage />
					</RouterContextMock>,
				);
				const button = screen.getByRole('button', { name: 'Homepage' });

				userEvent.click(button);

				await waitFor(() => expect(currentPath.current).toBe('/home'));
			});
		});
	});
});
