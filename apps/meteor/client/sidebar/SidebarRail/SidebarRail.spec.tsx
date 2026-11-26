import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';

import * as stories from './SidebarRail.stories';

jest.mock('../../lib/getURL', () => ({
	getURL: (url: string) => url,
}));

const { LoggedIn } = composeStories(stories);

describe('SidebarRail', () => {
	it('should leave out the Voice Call group when calls are unavailable', () => {
		render(<LoggedIn />);

		expect(screen.getByRole('group', { name: 'Pages and actions' })).toBeInTheDocument();
		expect(screen.queryByRole('group', { name: 'Voice Call' })).not.toBeInTheDocument();
	});
});
