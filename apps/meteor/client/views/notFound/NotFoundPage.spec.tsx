import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MutableRefObject } from 'react';
import React from 'react';

import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import NotFoundPage from './NotFoundPage';

it('should look good', async () => {
	render(<NotFoundPage />, { legacyRoot: true });

	await expect(screen.findByRole('heading')).resolves.toHaveTextContent('Page_not_found');

	expect(screen.getByRole('button', { name: 'Homepage' })).not.toBeDisabled();
});

it('should have correct tab order', async () => {
	render(<NotFoundPage />, { legacyRoot: true });

	expect(document.body).toHaveFocus();

	await userEvent.tab();

	expect(screen.getByRole('button', { name: 'Homepage' })).toHaveFocus();

	await userEvent.tab();

	expect(document.body).toHaveFocus();
});

describe('"Return to home" button', () => {
	describe('when clicked', () => {
		it('should go back on history', async () => {
			const currentPath: MutableRefObject<string | undefined> = { current: undefined };

			render(
				<RouterContextMock currentPath={currentPath}>
					<NotFoundPage />
				</RouterContextMock>,
				{ legacyRoot: true },
			);
			const button = screen.getByRole('button', { name: 'Homepage' });

			await userEvent.click(button);

			await waitFor(() => expect(currentPath.current).toBe('/home'));
		});
	});
});
