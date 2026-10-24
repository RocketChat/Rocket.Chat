import { css } from '@rocket.chat/css-in-js';
import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';

import FieldGroup from './FieldGroup';
import * as stories from './FieldGroup.stories';
import { render } from '../../testing';
import { Box } from '../Box';

const { Default } = composeStories(stories);

describe('[FieldGroup Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	it('keeps the css-in-js styles of its children', () => {
		render(
			<FieldGroup>
				<Box
					className={css`
						color: red;
					`}
				>
					Child
				</Box>
			</FieldGroup>,
		);

		const child = screen.getByText('Child');
		expect(child).toHaveClass('rcx-field-group__item');
		expect(child.className).not.toContain('color');
		expect(child.className).toMatch(/rcx-css-/);
	});
});
