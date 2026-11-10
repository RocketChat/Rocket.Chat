import ThreadMessage from './ThreadMessage';
import ThreadMessageEmoji from './ThreadMessageEmoji';
import { render, screen } from '../../../testing';

it('renders without crashing', () => {
	render(<ThreadMessage />);
});

it('renders the text children of ThreadMessageEmoji', () => {
	render(<ThreadMessageEmoji name='grinning'>😀</ThreadMessageEmoji>);
	expect(screen.getByText('😀')).toBeInTheDocument();
});
