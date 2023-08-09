import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import type { MutableRefObject } from 'react';
import React from 'react';

import NotFoundPage from '../../../../../client/views/notFound/NotFoundPage';
import RouterContextMock from '../../../../mocks/client/RouterContextMock';

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

				await waitFor(() => expect(currentPath.current).to.be.equal('/home'));
			});
		});
	});
});
