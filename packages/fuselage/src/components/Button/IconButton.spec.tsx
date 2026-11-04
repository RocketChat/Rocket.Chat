import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';

import { render } from '../../testing';
import { Badge } from '../Badge';
import { Icon } from '../Icon';
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

	it.each([
		['primary', 'secondary-info'],
		['secondary', 'secondary'],
		['info', 'info'],
		['danger', 'danger'],
		['warning', 'warning'],
		['success', 'success'],
		['secondary-danger', 'secondary-danger'],
		['secondary-warning', 'secondary-warning'],
		['secondary-success', 'secondary-success'],
	] as const)('should paint variant %s with the %s style', (variant, style) => {
		const { rerender } = render(<IconButton icon='balloon' aria-label='balloon' variant={variant} />);
		expect(screen.getByRole('button')).toHaveClass(`rcx-button--icon-${style}`);

		rerender(<IconButton icon='balloon' aria-label='balloon' variant={variant} pressed />);
		expect(screen.getByRole('button')).toHaveClass(`rcx-button--icon-${style}-pressed`);
	});

	it.each([
		['mini', 'x12'],
		['tiny', 'x16'],
		['small', 'x20'],
		['medium', 'x24'],
		['large', 'x28'],
	] as const)('should size %s with a %s glyph', (size, glyph) => {
		render(<IconButton icon='balloon' aria-label='balloon' size={size} />);
		const { container } = render(<Icon name='balloon' size={glyph} />);

		expect(screen.getByRole('button')).toHaveClass(`rcx-button--${size}-square`);
		expect(screen.getByRole('button').firstElementChild?.className).toBe(container.firstElementChild?.className);
	});

	it('should be large by default', () => {
		render(<IconButton icon='balloon' aria-label='balloon' />);
		expect(screen.getByRole('button')).toHaveClass('rcx-button--large-square');
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
