import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { render } from '../../testing';
import { Badge } from '../Badge';
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

	const renderMarkup = (props: Partial<ComponentProps<typeof IconButton>>) =>
		render(<IconButton icon='balloon' aria-label='balloon' {...props} />).container.innerHTML;

	it.each([
		['primary', { primary: true }],
		['secondary', { secondary: true }],
		['info', { info: true }],
		['danger', { danger: true }],
		['warning', { warning: true }],
		['success', { success: true }],
		['secondary-danger', { secondary: true, danger: true }],
		['secondary-warning', { secondary: true, warning: true }],
		['secondary-success', { secondary: true, success: true }],
	] as const)('should render variant %s as its deprecated boolean props did', (variant, booleans) => {
		expect(renderMarkup({ variant })).toBe(renderMarkup(booleans));
		expect(renderMarkup({ variant, pressed: true })).toBe(renderMarkup({ ...booleans, pressed: true }));
	});

	it.each(['mini', 'tiny', 'small', 'medium', 'large'] as const)('should render size %s as its deprecated boolean prop did', (size) => {
		expect(renderMarkup({ size })).toBe(renderMarkup({ [size]: true }));
	});

	it('should prefer variant and size over the deprecated boolean props', () => {
		expect(renderMarkup({ variant: 'danger', secondary: true, size: 'small', large: true })).toBe(
			renderMarkup({ danger: true, small: true }),
		);
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

	it('should pin the badge to the bottom end corner', () => {
		const { container } = render(<IconButton icon='balloon' aria-label='balloon' badgePosition='bottom-end' badge={<Badge>2</Badge>} />);
		expect(container.querySelector('.rcx-button__badge')).toHaveClass('rcx-button__badge--bottom-end');
	});

	it('should render a button of type button by default', () => {
		render(<IconButton icon='balloon' aria-label='balloon' />);
		expect(screen.getByRole('button', { name: 'balloon' })).toHaveAttribute('type', 'button');
	});

	it('should render a link without a type when is is a', () => {
		render(<IconButton is='a' href='/somewhere' icon='balloon' aria-label='balloon' />);
		const link = screen.getByRole('link', { name: 'balloon' });
		expect(link).not.toHaveAttribute('type');
		expect(link).not.toHaveAttribute('target');
	});

	it('should open an external link in a new tab without access to the opener', () => {
		render(<IconButton is='a' href='https://rocket.chat' external icon='balloon' aria-label='balloon' />);
		const link = screen.getByRole('link', { name: 'balloon' });
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});
});
