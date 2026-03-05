import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SpoilerSpan from './SpoilerSpan';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string, opts?: Record<string, string>) => opts?.defaultValue ?? key }),
}));

describe('SpoilerSpan', () => {
	const plainChild = (text: string) => [{ type: 'PLAIN_TEXT' as const, value: text }];

	it('renders as a button when hidden', () => {
		render(<SpoilerSpan>{plainChild('Secret text')}</SpoilerSpan>);
		expect(screen.getByRole('button')).toBeInTheDocument();
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('has an accessible label describing spoiler', () => {
		render(<SpoilerSpan>{plainChild('Secret')}</SpoilerSpan>);
		expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Spoiler hidden. Activate to reveal.');
	});

	it('reveals content on click', async () => {
		render(<SpoilerSpan>{plainChild('Revealed text')}</SpoilerSpan>);

		await userEvent.click(screen.getByRole('button'));
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(screen.getByText('Revealed text')).toBeInTheDocument();
	});

	it('reveals content on Enter key', async () => {
		render(<SpoilerSpan>{plainChild('Secret')}</SpoilerSpan>);

		screen.getByRole('button').focus();
		await userEvent.keyboard('{Enter}');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(screen.getByText('Secret')).toBeInTheDocument();
	});

	it('reveals content on Space key', async () => {
		render(<SpoilerSpan>{plainChild('Secret')}</SpoilerSpan>);

		screen.getByRole('button').focus();
		await userEvent.keyboard(' ');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('renders bold children after reveal', async () => {
		render(<SpoilerSpan>{[{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold secret' }] }]}</SpoilerSpan>);

		await userEvent.click(screen.getByRole('button'));
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold secret').closest('strong')).toBeInTheDocument();
	});

	it('renders inline code children', async () => {
		render(<SpoilerSpan>{[{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'secret()' } }]}</SpoilerSpan>);

		await userEvent.click(screen.getByRole('button'));
		expect(screen.getByText('secret()')).toBeInTheDocument();
	});

	it('renders italic children', async () => {
		render(<SpoilerSpan>{[{ type: 'ITALIC', value: [{ type: 'PLAIN_TEXT', value: 'Italic secret' }] }]}</SpoilerSpan>);

		await userEvent.click(screen.getByRole('button'));
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Italic secret').closest('em')).toBeInTheDocument();
	});

	it('renders strike children', async () => {
		render(<SpoilerSpan>{[{ type: 'STRIKE', value: [{ type: 'PLAIN_TEXT', value: 'Struck secret' }] }]}</SpoilerSpan>);

		await userEvent.click(screen.getByRole('button'));
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Struck secret').closest('del')).toBeInTheDocument();
	});

	it('matches snapshot when hidden', () => {
		const { container } = render(<SpoilerSpan>{plainChild('Snapshot spoiler')}</SpoilerSpan>);
		expect(container).toMatchSnapshot();
	});

	it('matches snapshot when revealed', async () => {
		const { container } = render(<SpoilerSpan>{plainChild('Revealed snapshot')}</SpoilerSpan>);
		await userEvent.click(screen.getByRole('button'));
		expect(container).toMatchSnapshot();
	});
});
