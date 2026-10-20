import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';

import { render } from '../../testing';
import { Badge } from '../Badge';
import Button from './Button';
import IconButton from './IconButton';
import * as stories from './IconButton.stories';

const { _IconButtonWithBadge, _IconButtonAvatarWithBadge, _IconButtonWithDot } = composeStories(stories);

describe('[IconButton Component]', () => {
	describe('Story renders without crashing', () => {
		it('_IconButtonWithBadge', () => {
			render(<_IconButtonWithBadge />);
		});
		it('_IconButtonAvatarWithBadge', () => {
			render(<_IconButtonAvatarWithBadge />);
		});
		it('_IconButtonWithDot', () => {
			render(<_IconButtonWithDot />);
		});
	});

	it('should display the badge', () => {
		render(<IconButton icon='balloon' aria-label='balloon' badge={<Badge>2</Badge>} />);
		screen.getByText('2');
	});

	it('should not render a badge when there is none', () => {
		const { container } = render(<IconButton icon='balloon' aria-label='balloon' />);
		expect(container.querySelector('.rcx-button__badge')).not.toBeInTheDocument();
		expect(container.querySelector('.rcx-button--with-badge')).not.toBeInTheDocument();
	});

	it('should hide the badge from assistive technology', () => {
		const { container } = render(<IconButton icon='balloon' aria-label='balloon, 2 unread messages' badge={<Badge>2</Badge>} />);
		expect(screen.getByRole('button', { name: 'balloon, 2 unread messages' })).toBeInTheDocument();
		expect(container.querySelector('.rcx-button__badge')).toHaveAttribute('aria-hidden', 'true');
	});

	it('should keep `pressed` off the DOM element', () => {
		// `Menu` hands `pressed` to whatever trigger it clones, a plain `Button` included
		const menuTriggerProps = { pressed: false };
		const { container } = render(
			<>
				<IconButton icon='balloon' aria-label='on' pressed />
				<IconButton icon='balloon' aria-label='off' pressed={false} />
				<Button {...menuTriggerProps}>label</Button>
			</>,
		);

		expect(container.querySelector('[pressed]')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'on' })).toHaveClass('rcx-button--icon-pressed');
		expect(console.error).not.toHaveBeenCalled();
	});
});
