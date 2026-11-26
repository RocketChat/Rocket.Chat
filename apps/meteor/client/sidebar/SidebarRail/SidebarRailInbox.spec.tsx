import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import SidebarRailInbox from './SidebarRailInbox';
import * as stories from './SidebarRailInbox.stories';
import SidebarPortal from '../../portals/SidebarPortal';
import LayoutProvider from '../../providers/LayoutProvider';

const { WithMentions } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

let sidebarRegion: HTMLElement | undefined;

afterEach(() => {
	sidebarRegion?.remove();
	sidebarRegion = undefined;
});

it.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('shows the sum of the room list group badges in the color of the most important one', () => {
	render(<WithMentions />);

	expect(screen.getByText('5')).toHaveClass('rcx-badge--danger');
});

it('is not pressed while a page shows its own sidebar over the room list', () => {
	sidebarRegion = document.createElement('div');
	sidebarRegion.id = 'sidebar-region';
	document.body.appendChild(sidebarRegion);

	const { rerender } = render(
		<LayoutProvider>
			<SidebarRailInbox />
			<SidebarPortal>page sidebar</SidebarPortal>
		</LayoutProvider>,
		{ wrapper: mockAppRoot().withSubscriptions([]).build() },
	);

	expect(screen.getByRole('button', { name: 'Inbox_and_home' })).not.toHaveClass('rcx-button--icon-pressed');

	rerender(
		<LayoutProvider>
			<SidebarRailInbox />
		</LayoutProvider>,
	);

	expect(screen.getByRole('button', { name: 'Inbox_and_home' })).toHaveClass('rcx-button--icon-pressed');
});
