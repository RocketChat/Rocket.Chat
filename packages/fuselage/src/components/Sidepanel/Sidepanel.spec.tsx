import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Sidepanel from './Sidepanel';
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
		render(
			<SidepanelList aria-label='Rooms'>
				<div role='listitem'>general</div>
			</SidepanelList>,
		);

		expect(screen.getByRole('list', { name: 'Rooms' })).toHaveClass('rcx-item-group', 'rcx-sidepanel-list');
	});

	it('should render `SidepanelDivider` as an `ItemDivider` separator', () => {
		render(<SidepanelDivider />);

		expect(screen.getByRole('separator')).toHaveClass('rcx-item-divider', 'rcx-sidepanel--divider');
	});

	it('should keep the full-width panel line under `SidepanelHeader`', () => {
		render(<SidepanelHeader>Title</SidepanelHeader>);

		expect(screen.getByRole('separator')).toHaveClass('rcx-sidepanel--divider');
		expect(screen.getByRole('separator')).not.toHaveClass('rcx-item-divider');
	});
});
describe('[Sidepanel]', () => {
	it('preserves the root element and HTML attributes', () => {
		render(
			<Sidepanel role='complementary' aria-label='Calls' className='custom-panel'>
				Panel content
			</Sidepanel>,
		);

		const panel = screen.getByRole('complementary', { name: 'Calls' });

		expect(panel.tagName).toBe('DIV');
		expect(panel).toHaveClass('rcx-sidepanel', 'custom-panel');
		expect(panel).toHaveAttribute('aria-label', 'Calls');
		expect(panel).toHaveTextContent('Panel content');
	});
	it('preserves the sidepanel variant when props contain an extra variant', () => {
	    const props = {
	      variant: 'default' as const,
	      'aria-label': 'Calls',
	    };
	
	    render(<Sidepanel {...props} />);
	
	    const panel = screen.getByLabelText('Calls');
	
	    expect(panel.tagName).toBe('DIV');
	    expect(panel).toHaveClass('rcx-sidepanel');
	    expect(panel).not.toHaveClass('rcx-sidebar');
	});
});
