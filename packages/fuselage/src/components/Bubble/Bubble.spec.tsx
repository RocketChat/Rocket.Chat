import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import Bubble from './Bubble';
import * as stories from './Bubble.stories';
import { BubbleButton } from './BubbleButton';
import { BubbleItem } from './BubbleItem';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Bubble Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	describe('className handling', () => {
		it('preserves default classes on Bubble when className is passed', () => {
			const { container } = render(<Bubble className='custom-bubble'>Text</Bubble>);
			expect(container.firstElementChild).toHaveClass('rcx-bubble');
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveClass('custom-bubble');
		});

		it('preserves default classes on BubbleButton when className is passed', () => {
			const { container } = render(<BubbleButton onClick={() => {}} className='custom-button' label='Button' />);
			expect(container.firstElementChild).toHaveClass('rcx-bubble__button');
			expect(container.firstElementChild).toHaveClass('custom-button');
		});

		it('preserves default classes on BubbleItem when className is passed', () => {
			const { container } = render(<BubbleItem className='custom-item' label='Item' />);
			expect(container.firstElementChild).toHaveClass('rcx-bubble__item');
			expect(container.firstElementChild).toHaveClass('custom-item');
		});
	});
});
