import { screen } from '@testing-library/react';

import { FlexContainer, FlexItem } from './index.js';
import { render } from '../../testing.js';
import { Box } from '../Box/index.js';

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
