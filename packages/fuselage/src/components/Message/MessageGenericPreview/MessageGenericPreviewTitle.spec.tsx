import { screen } from '@testing-library/react';

import MessageGenericPreviewTitle from './MessageGenericPreviewTitle';
import { render } from '../../../testing';

describe('MessageGenericPreviewTitle', () => {
	it('shows the title as a link when it has an external url', () => {
		render(<MessageGenericPreviewTitle externalUrl='https://rocket.chat'>report.pdf</MessageGenericPreviewTitle>);

		expect(screen.getByRole('link', { name: 'report.pdf' })).toHaveAttribute('href', 'https://rocket.chat');
	});

	it('shows the title as text when it has no external url', () => {
		render(<MessageGenericPreviewTitle>report.pdf</MessageGenericPreviewTitle>);

		expect(screen.getByText('report.pdf')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});
});
