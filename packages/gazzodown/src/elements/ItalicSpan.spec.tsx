import { render, screen } from '@testing-library/react';

import ItalicSpan from './ItalicSpan';

describe('ItalicSpan', () => {
	it('renders italic text with em tag', () => {
		render(<ItalicSpan>{[{ type: 'PLAIN_TEXT', value: 'Italic text' }]}</ItalicSpan>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Italic text').closest('em')).toBeInTheDocument();
	});

	it('renders nested bold inside italic', () => {
		render(<ItalicSpan>{[{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold inside italic' }] }]}</ItalicSpan>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold inside italic').closest('strong')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<ItalicSpan>{[{ type: 'PLAIN_TEXT', value: 'Snapshot italic' }]}</ItalicSpan>);
		expect(container).toMatchSnapshot();
	});
});
