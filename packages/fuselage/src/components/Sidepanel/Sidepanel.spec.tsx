import { composeStories } from '@storybook/react-vite';
import { axe } from 'jest-axe';

import * as stories from './Sidepanel.stories';
import SidepanelDivider from './SidepanelDivider';
import SidepanelHeader from './SidepanelHeader';
import SidepanelList from './SidepanelList';
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
});
