import { render, screen } from '@testing-library/react';

import StrikeSpan from './StrikeSpan';

describe('StrikeSpan', () => {
	it('renders strikethrough with del tag', () => {
		render(<StrikeSpan>{[{ type: 'PLAIN_TEXT', value: 'Deleted text' }]}</StrikeSpan>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Deleted text').closest('del')).toBeInTheDocument();
	});

	it('renders nested bold inside strike', () => {
		render(<StrikeSpan>{[{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold struck' }] }]}</StrikeSpan>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold struck').closest('strong')).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold struck').closest('del')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<StrikeSpan>{[{ type: 'PLAIN_TEXT', value: 'Snapshot strike' }]}</StrikeSpan>);
		expect(container).toMatchSnapshot();
	});
});
