import { composeStories } from '@storybook/react';
import { axe } from 'jest-axe';

import * as stories from './Sidepanel.stories';
import SidepanelDivider from './SidepanelDivider';
import SidepanelHeader from './SidepanelHeader';
import SidepanelList from './SidepanelList';
import SidepanelListItem from './SidepanelListItem';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

describe('[Sidepanel bridges]', () => {
	it('should render `SidepanelList` as an `ItemGroup` list', () => {
		const { getByRole } = render(
			<SidepanelList aria-label='Rooms'>
				<div role='listitem'>general</div>
			</SidepanelList>,
		);

		expect(getByRole('list', { name: 'Rooms' })).toHaveClass('rcx-item-group', 'rcx-sidepanel-list');
	});

	it('should render `SidepanelDivider` as an `ItemDivider` separator', () => {
		const { getByRole } = render(<SidepanelDivider />);

		expect(getByRole('separator')).toHaveClass('rcx-item-divider', 'rcx-sidepanel--divider');
	});

	it('should keep the full-width panel line under `SidepanelHeader`', () => {
		const { container } = render(<SidepanelHeader>Title</SidepanelHeader>);

		expect(container.querySelector('.rcx-sidepanel--divider')).not.toHaveClass('rcx-item-divider');
	});

	it("should give the virtualizer its offsets and drop what is not the row's", () => {
		const { getByRole } = render(
			<SidepanelList aria-label='Rooms' style={{ paddingTop: 40, paddingBottom: 20 }}>
				{/* a virtualizer's `item` prop is no DOM attribute */}
				<SidepanelListItem {...({ item: {} } as object)} data-index={3} style={{ overflowAnchor: 'none' }}>
					general
				</SidepanelListItem>
			</SidepanelList>,
		);

		expect(getByRole('list', { name: 'Rooms' })).toHaveStyle({ paddingTop: '40px', paddingBottom: '20px' });
		expect(getByRole('listitem')).toHaveStyle({ overflowAnchor: 'none' });
		expect(getByRole('listitem')).toHaveAttribute('data-index', '3');
		expect(getByRole('listitem')).not.toHaveAttribute('item');
	});
});
