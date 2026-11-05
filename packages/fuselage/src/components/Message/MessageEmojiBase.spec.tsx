import { screen } from '@testing-library/react';

import MessageEmoji from './MessageEmoji';
import MessageEmojiBase from './MessageEmojiBase';
import MessageReactionEmoji from './MessageReactions/MessageReactionEmoji';
import ThreadMessageEmoji from './ThreadMessage/ThreadMessageEmoji';
import { render } from '../../testing';

describe('[MessageEmojiBase Component]', () => {
	it('renders without crashing', () => {
		render(<MessageEmojiBase data-testid='emoji' name='smile' />);
		expect(screen.getByTestId('emoji')).toBeInTheDocument();
	});

	it('renders with background image when image prop is provided', () => {
		render(<MessageEmojiBase data-testid='emoji' image='url("smile.png")' name='smile' />);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			backgroundImage: 'url("smile.png")',
		});
	});

	it('preserves background image when custom style is passed', () => {
		render(
			<MessageEmojiBase data-testid='emoji' image='url("smile.png")' name='smile' style={{ color: 'rgb(255, 0, 0)', fontSize: '16px' }} />,
		);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			backgroundImage: 'url("smile.png")',
			color: 'rgb(255, 0, 0)',
			fontSize: '16px',
		});
	});

	it('keeps generated backgroundImage even if caller passes a conflicting backgroundImage in style', () => {
		render(
			<MessageEmojiBase
				data-testid='emoji'
				image='url("smile.png")'
				name='smile'
				style={{ backgroundImage: 'none', color: 'rgb(255, 0, 0)' }}
			/>,
		);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			backgroundImage: 'url("smile.png")',
			color: 'rgb(255, 0, 0)',
		});
	});

	it('renders custom style when image is not provided', () => {
		render(<MessageEmojiBase data-testid='emoji' name='smile' style={{ color: 'rgb(255, 0, 0)' }} />);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			color: 'rgb(255, 0, 0)',
		});
		expect(emoji.style.backgroundImage).toBe('');
	});
});

describe('[MessageEmoji Wrappers]', () => {
	it('preserves background image when custom style is passed to MessageEmoji', () => {
		render(<MessageEmoji data-testid='emoji' image='url("smile.png")' name='smile' style={{ margin: '4px' }} />);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			backgroundImage: 'url("smile.png")',
			margin: '4px',
		});
	});

	it('preserves background image when custom style is passed to MessageReactionEmoji', () => {
		render(<MessageReactionEmoji data-testid='emoji' image='url("smile.png")' name='smile' style={{ margin: '4px' }} />);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			backgroundImage: 'url("smile.png")',
			margin: '4px',
		});
	});

	it('preserves background image when custom style is passed to ThreadMessageEmoji', () => {
		render(<ThreadMessageEmoji data-testid='emoji' image='url("smile.png")' name='smile' style={{ margin: '4px' }} />);
		const emoji = screen.getByTestId('emoji');

		expect(emoji).toHaveStyle({
			backgroundImage: 'url("smile.png")',
			margin: '4px',
		});
	});
});
