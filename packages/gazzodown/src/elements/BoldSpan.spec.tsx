import { render, screen } from '@testing-library/react';

import BoldSpan from './BoldSpan';

describe('BoldSpan', () => {
	it('renders bold text with strong tag', () => {
		render(<BoldSpan>{[{ type: 'PLAIN_TEXT', value: 'Bold text' }]}</BoldSpan>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold text').closest('strong')).toBeInTheDocument();
	});

	it('renders nested italic inside bold', () => {
		render(
			<BoldSpan>
				{[
					{
						type: 'ITALIC',
						value: [{ type: 'PLAIN_TEXT', value: 'Bold italic' }],
					},
				]}
			</BoldSpan>,
		);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold italic').closest('em')).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold italic').closest('strong')).toBeInTheDocument();
	});

	it('renders nested strike inside bold', () => {
		render(
			<BoldSpan>
				{[
					{
						type: 'STRIKE',
						value: [{ type: 'PLAIN_TEXT', value: 'Struck bold' }],
					},
				]}
			</BoldSpan>,
		);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Struck bold').closest('del')).toBeInTheDocument();
	});

	it('renders inline code inside bold', () => {
		render(
			<BoldSpan>
				{[
					{
						type: 'INLINE_CODE',
						value: { type: 'PLAIN_TEXT', value: 'code()' },
					},
				]}
			</BoldSpan>,
		);
		expect(screen.getByText('code()')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<BoldSpan>
				{[
					{ type: 'PLAIN_TEXT', value: 'Bold ' },
					{ type: 'ITALIC', value: [{ type: 'PLAIN_TEXT', value: 'and italic' }] },
				]}
			</BoldSpan>,
		);
		expect(container).toMatchSnapshot();
	});
});
