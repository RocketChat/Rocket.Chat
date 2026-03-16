import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SpoilerBlock from './SpoilerBlock';

describe('SpoilerBlock', () => {
	it('renders as a button when hidden', () => {
		render(<SpoilerBlock>{[{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Hidden content' }] }]}</SpoilerBlock>);
		expect(screen.getByRole('button')).toBeInTheDocument();
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('reveals content on click', async () => {
		render(<SpoilerBlock>{[{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Hidden content' }] }]}</SpoilerBlock>);

		await userEvent.click(screen.getByRole('button'));
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(screen.getByText('Hidden content')).toBeInTheDocument();
	});

	it('reveals content on Enter key', async () => {
		render(<SpoilerBlock>{[{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Secret' }] }]}</SpoilerBlock>);

		screen.getByRole('button').focus();
		await userEvent.keyboard('{Enter}');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(screen.getByText('Secret')).toBeInTheDocument();
	});

	it('reveals content on Space key', async () => {
		render(<SpoilerBlock>{[{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Secret' }] }]}</SpoilerBlock>);

		screen.getByRole('button').focus();
		await userEvent.keyboard(' ');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('matches snapshot when hidden', () => {
		const { container } = render(
			<SpoilerBlock>{[{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Snapshot spoiler' }] }]}</SpoilerBlock>,
		);
		expect(container).toMatchSnapshot();
	});
});
