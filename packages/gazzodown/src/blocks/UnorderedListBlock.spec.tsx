import { render, screen } from '@testing-library/react';

import UnorderedListBlock from './UnorderedListBlock';

describe('UnorderedListBlock', () => {
	it('renders list items', () => {
		render(
			<UnorderedListBlock
				items={[
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Apple' }] },
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Banana' }] },
				]}
			/>,
		);

		expect(screen.getByRole('list')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
		expect(screen.getByText('Apple')).toBeInTheDocument();
		expect(screen.getByText('Banana')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<UnorderedListBlock items={[{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Item' }] }]} />);
		expect(container).toMatchSnapshot();
	});
});
