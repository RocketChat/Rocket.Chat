import { composeStories } from '@storybook/react-vite';

import MessageEmoji from './MessageEmoji';
import * as stories from './Messages.stories';
import { render, screen } from '../../testing';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});

describe('[MessageEmoji children]', () => {
	it('renders text children', () => {
		render(<MessageEmoji name='grinning'>😀</MessageEmoji>);
		expect(screen.getByText('😀')).toBeInTheDocument();
	});
});
