import { composeStories } from '@storybook/react-vite';

import * as stories from './PopoverSurface.stories';
import { render } from '../../testing';

const { Default, HalfScreen, Flush } = composeStories(stories);

const surface = (container: HTMLElement) => container.querySelector('.rcx-tile') as Element;

describe('[PopoverSurface Component]', () => {
	it('renders a raised, scrolling column', () => {
		const { container } = render(<Default />);
		expect(surface(container)).toHaveClass('rcx-tile--elevation-2');
		expect(getComputedStyle(surface(container))).toMatchObject({ display: 'flex', flexDirection: 'column', overflow: 'auto' });
	});

	it('sits lower at elevation 1', () => {
		const { container } = render(<Default elevation='1' />);
		expect(surface(container)).toHaveClass('rcx-tile--elevation-1');
	});

	it('caps the height at half the viewport', () => {
		const { container } = render(<HalfScreen />);
		expect(getComputedStyle(surface(container)).maxHeight).toBe('50vh');
	});

	it('drops the block padding when flush', () => {
		const padded = getComputedStyle(surface(render(<Default />).container)).paddingTop;
		const flush = getComputedStyle(surface(render(<Flush />).container)).paddingTop;
		expect(padded).toBeTruthy();
		expect(flush).not.toBe(padded);
	});
});
