import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import * as stories from './Callout.stories';
import Callout from './Callout';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[CheckBox Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('Callout', () => {
	it('forwards its ref to the root element and attaches the resize observer', () => {
		const ref = createRef<HTMLElement>();
		render(<Callout ref={ref} data-testid='callout' />);

		const element = screen.getByTestId('callout');
		expect(ref.current).toBe(element);

		const [observerInstance] = (globalThis.ResizeObserver as jest.Mock).mock.results.slice(-1);
		expect(observerInstance.value.observe).toHaveBeenCalledWith(element);
	});

	it('attaches the resize observer when no caller ref is provided', () => {
		render(<Callout data-testid='callout' />);

		const element = screen.getByTestId('callout');
		const [observerInstance] = (globalThis.ResizeObserver as jest.Mock).mock.results.slice(-1);
		expect(observerInstance.value.observe).toHaveBeenCalledWith(element);
	});
});
