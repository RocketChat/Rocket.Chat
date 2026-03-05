import { render, screen } from '@testing-library/react';

import OrderedListBlock from './OrderedListBlock';

describe('OrderedListBlock', () => {
	it('renders numbered list items', () => {
		render(
			<OrderedListBlock
				items={[
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'First' }] },
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Second' }] },
				]}
			/>,
		);

		expect(screen.getByRole('list')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
	});

	it('matches snapshot', () => {
		const { container } = render(<OrderedListBlock items={[{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Item' }] }]} />);
		expect(container).toMatchSnapshot();
	});
});
