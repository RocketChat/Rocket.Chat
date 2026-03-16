import { render, screen } from '@testing-library/react';

import LinkSpan from './LinkSpan';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string, opts?: Record<string, string>) => (opts?.href ? `${key}: ${opts.href}` : key) }),
}));

jest.mock('@rocket.chat/ui-client/dist/helpers/getBaseURI', () => ({
	getBaseURI: jest.fn(() => 'http://localhost:3000/'),
	isExternal: jest.fn((href: string) => !href.startsWith('http://localhost:3000/')),
}));

describe('LinkSpan', () => {
	it('renders a link with plain text label', () => {
		render(<LinkSpan href='https://example.com' label={[{ type: 'PLAIN_TEXT', value: 'Example' }]} />);
		const link = screen.getByRole('link');
		expect(link).toHaveTextContent('Example');
		expect(link).toHaveAttribute('href', 'https://example.com/');
	});

	it('renders external link with target _blank', () => {
		render(<LinkSpan href='https://example.com' label={[{ type: 'PLAIN_TEXT', value: 'External' }]} />);
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('renders internal link without target _blank', () => {
		render(<LinkSpan href='http://localhost:3000/channel/general' label={[{ type: 'PLAIN_TEXT', value: 'General' }]} />);
		const link = screen.getByRole('link');
		expect(link).not.toHaveAttribute('target', '_blank');
	});

	it('renders bold label markup', () => {
		render(<LinkSpan href='https://example.com' label={[{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold link' }] }]} />);
		expect(screen.getByText('Bold link')).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold link').closest('strong')).toBeInTheDocument();
	});

	it('renders italic label markup', () => {
		render(<LinkSpan href='https://example.com' label={[{ type: 'ITALIC', value: [{ type: 'PLAIN_TEXT', value: 'Italic link' }] }]} />);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Italic link').closest('em')).toBeInTheDocument();
	});

	it('renders strike label markup', () => {
		render(<LinkSpan href='https://example.com' label={[{ type: 'STRIKE', value: [{ type: 'PLAIN_TEXT', value: 'Struck link' }] }]} />);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Struck link').closest('del')).toBeInTheDocument();
	});

	it('sanitizes javascript: URLs', () => {
		render(<LinkSpan href='javascript:alert(1)' label={[{ type: 'PLAIN_TEXT', value: 'XSS' }]} />);
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '#');
	});

	it('accepts a single label object (not array)', () => {
		render(<LinkSpan href='https://example.com' label={{ type: 'PLAIN_TEXT', value: 'Single' }} />);
		expect(screen.getByText('Single')).toBeInTheDocument();
	});

	it('matches snapshot for external link', () => {
		const { container } = render(<LinkSpan href='https://example.com' label={[{ type: 'PLAIN_TEXT', value: 'Snapshot link' }]} />);
		expect(container).toMatchSnapshot();
	});

	it('matches snapshot for internal link', () => {
		const { container } = render(
			<LinkSpan href='http://localhost:3000/channel/test' label={[{ type: 'PLAIN_TEXT', value: 'Internal' }]} />,
		);
		expect(container).toMatchSnapshot();
	});
});
