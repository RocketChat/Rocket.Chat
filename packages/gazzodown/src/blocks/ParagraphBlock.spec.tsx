import { render, screen } from '@testing-library/react';

import ParagraphBlock from './ParagraphBlock';

describe('ParagraphBlock', () => {
	it('renders plain text children', () => {
		render(<ParagraphBlock>{[{ type: 'PLAIN_TEXT', value: 'Some text' }]}</ParagraphBlock>);
		expect(screen.getByText('Some text')).toBeInTheDocument();
	});

	it('renders multiple inline children', () => {
		render(
			<ParagraphBlock>
				{[
					{ type: 'PLAIN_TEXT', value: 'Hello ' },
					{ type: 'PLAIN_TEXT', value: 'World' },
				]}
			</ParagraphBlock>,
		);
		expect(screen.getByText(/Hello/)).toBeInTheDocument();
		expect(screen.getByText(/World/)).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<ParagraphBlock>{[{ type: 'PLAIN_TEXT', value: 'Snapshot paragraph' }]}</ParagraphBlock>);
		expect(container).toMatchSnapshot();
	});
});
