import { fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';

import Tabs from './Tabs';
import TabsItem from './TabsItem';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

withResizeObserverMock();

describe('[Tabs Component]', () => {
	it('renders without crashing', () => {
		render(<Tabs />);
	});

	it('should have no a11y violations', async () => {
		const { container } = render(
			<Tabs>
				<TabsItem selected>Tab 1</TabsItem>
				<TabsItem>Tab 2</TabsItem>
			</Tabs>,
		);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('renders with divider by default', () => {
		const { container } = render(<Tabs />);
		expect(container.querySelector('.rcx-tabs')).toHaveClass('rcx-tabs--with-divider');
	});

	it('renders without divider when divider=false', () => {
		const { container } = render(<Tabs divider={false} />);
		expect(container.querySelector('.rcx-tabs')).not.toHaveClass('rcx-tabs--with-divider');
	});

	it('applies overflow classes when scrollable content overflows', () => {
		const { container } = render(
			<Tabs>
				<div>Tab 1</div>
			</Tabs>,
		);
		const tabsElement = container.querySelector('.rcx-tabs');
		const scrollBox = container.querySelector('.rcx-tabs__scroll-box');
		expect(scrollBox).toBeInTheDocument();

		// Simulate overflow at start
		Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, value: 500 });
		Object.defineProperty(scrollBox, 'clientWidth', { configurable: true, value: 200 });
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 0 });

		fireEvent.scroll(scrollBox!);
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-end');
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-start');

		// Simulate scrolled to middle
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 50 });
		fireEvent.scroll(scrollBox!);
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-start');
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-end');

		// Simulate scrolled to end
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 300 });
		fireEvent.scroll(scrollBox!);
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-start');
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-end');
	});

	it('does not apply overflow classes when scrollShadow is false', () => {
		const { container } = render(
			<Tabs scrollShadow={false}>
				<div>Tab 1</div>
			</Tabs>,
		);
		const tabsElement = container.querySelector('.rcx-tabs');
		const scrollBox = container.querySelector('.rcx-tabs__scroll-box');

		Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, value: 500 });
		Object.defineProperty(scrollBox, 'clientWidth', { configurable: true, value: 200 });
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 50 });

		fireEvent.scroll(scrollBox!);
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-start');
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-end');
	});
});
