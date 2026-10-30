import { composeStories } from '@storybook/react-vite';
import { axe } from 'jest-axe';

import MessageReactionEmoji from './MessageReactionEmoji';
import * as stories from './MessageReactions.stories';
import { render, screen } from '../../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[MessageReactions Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[MessageReactionEmoji children]', () => {
	it('renders text children', () => {
		render(<MessageReactionEmoji name='grinning'>😀</MessageReactionEmoji>);
		expect(screen.getByText('😀')).toBeInTheDocument();
	});
});
