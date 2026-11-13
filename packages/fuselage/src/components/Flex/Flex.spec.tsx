import { screen } from '@testing-library/react';

import { FlexContainer, FlexItem } from '.';
import { render } from '../../testing';
import { Box } from '../Box';

describe('[Flex Component]', () => {
	it('renders FlexContainer without crashing', () => {
		render(
			<FlexContainer>
				<Box>Content</Box>
			</FlexContainer>,
		);
		expect(screen.getByText('Content')).toHaveStyle({ display: 'flex' });
	});

	it('renders FlexItem without crashing', () => {
		render(
			<FlexItem grow={1}>
				<Box>Content</Box>
			</FlexItem>,
		);
		expect(screen.getByText('Content')).toHaveStyle({ flexGrow: '1' });
	});
});
