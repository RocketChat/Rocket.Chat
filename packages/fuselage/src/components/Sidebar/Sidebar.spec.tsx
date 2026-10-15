import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import * as stories from './Sidebar.stories';
import { SidebarCollapseGroup } from './SidebarCollapseGroup';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Sidebar Default story]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
	it('should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[SidebarCollapseGroup]', () => {
	it('should not pass `actions` to the DOM', () => {
		const { container } = render(
			<SidebarCollapseGroup title='Favorites' actions={<span />}>
				<div />
			</SidebarCollapseGroup>,
		);

		expect(container.querySelector('.rcx-sidebar-collapse-group')).not.toHaveAttribute('actions');
	});
});
