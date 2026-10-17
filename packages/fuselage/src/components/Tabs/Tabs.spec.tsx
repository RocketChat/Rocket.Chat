import { act, fireEvent, waitFor } from '@testing-library/react';
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

	it('attaches ref to native scroll-box element for React 18 compatibility', () => {
		const { container } = render(
			<Tabs>
				<div>Tab 1</div>
			</Tabs>,
		);
		const scrollBox = container.querySelector('.rcx-tabs__scroll-box');
		expect(scrollBox).toBeInstanceOf(HTMLDivElement);
		expect(scrollBox).toHaveClass('rcx-box', 'rcx-box--full', 'rcx-tabs__scroll-box');

		const wrapper = container.querySelector('.rcx-tabs__wrapper');
		expect(wrapper).toBeInstanceOf(HTMLDivElement);
		expect(wrapper).toHaveClass('rcx-box', 'rcx-box--full', 'rcx-tabs__wrapper');
	});

	it('re-checks overflow when content size changes', async () => {
		const { container } = render(
			<Tabs>
				<div>Tab 1</div>
			</Tabs>,
		);
		const tabsElement = container.querySelector('.rcx-tabs');
		const scrollBox = container.querySelector('.rcx-tabs__scroll-box');
		const wrapper = container.querySelector('.rcx-tabs__wrapper');

		expect(scrollBox).toBeInTheDocument();
		expect(wrapper).toBeInTheDocument();

		Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, writable: true, value: 200 });
		Object.defineProperty(scrollBox, 'clientWidth', { configurable: true, writable: true, value: 200 });
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 0 });

		fireEvent.scroll(scrollBox!);
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-end');

		// Change content wrapper width to simulate content resize
		Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, writable: true, value: 600 });
		(wrapper as HTMLElement).style.width = '600px';

		await waitFor(() => {
			expect(tabsElement).toHaveClass('rcx-tabs--overflow-end');
		});
	});

	it('handles RTL via style direction and updates shadow gradients and overflow classes', () => {
		const { container } = render(
			<Tabs style={{ direction: 'rtl' }}>
				<div>Tab 1</div>
			</Tabs>,
		);
		const tabsElement = container.querySelector('.rcx-tabs');
		const scrollBox = container.querySelector('.rcx-tabs__scroll-box');

		expect(tabsElement).toHaveClass('rcx-tabs--rtl');

		// In RTL, at start (scrollLeft = 0), overflow-end is true, overflow-start is false
		Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, value: 500 });
		Object.defineProperty(scrollBox, 'clientWidth', { configurable: true, value: 200 });
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 0 });

		fireEvent.scroll(scrollBox!);
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-end');
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-start');

		// Scrolled to middle (negative scrollLeft)
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: -50 });
		fireEvent.scroll(scrollBox!);
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-start');
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-end');

		// Scrolled to end
		Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: -300 });
		fireEvent.scroll(scrollBox!);
		expect(tabsElement).toHaveClass('rcx-tabs--overflow-start');
		expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-end');
	});

	it('re-checks overflow when document fonts finish loading', async () => {
		let fontReadyCallback: () => void = () => undefined;
		const readyPromise = new Promise<void>((resolve) => {
			fontReadyCallback = resolve;
		});

		const originalFonts = (document as any).fonts;
		Object.defineProperty(document, 'fonts', {
			configurable: true,
			value: { ready: readyPromise },
		});

		try {
			const { container } = render(
				<Tabs>
					<div>Tab 1</div>
				</Tabs>,
			);
			const tabsElement = container.querySelector('.rcx-tabs');
			const scrollBox = container.querySelector('.rcx-tabs__scroll-box');

			Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, writable: true, value: 200 });
			Object.defineProperty(scrollBox, 'clientWidth', { configurable: true, writable: true, value: 200 });
			Object.defineProperty(scrollBox, 'scrollLeft', { configurable: true, writable: true, value: 0 });

			fireEvent.scroll(scrollBox!);
			expect(tabsElement).not.toHaveClass('rcx-tabs--overflow-end');

			// Late font load expands scrollWidth
			Object.defineProperty(scrollBox, 'scrollWidth', { configurable: true, writable: true, value: 500 });

			await act(async () => {
				fontReadyCallback();
				await readyPromise;
			});

			expect(tabsElement).toHaveClass('rcx-tabs--overflow-end');
		} finally {
			Object.defineProperty(document, 'fonts', {
				configurable: true,
				value: originalFonts,
			});
		}
	});
});
