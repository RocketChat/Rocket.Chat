import { render, screen } from '@testing-library/react';

import { useViewportScrollbars } from './useViewportScrollbars';

const update = jest.fn();
const destroy = jest.fn();
const overlayScrollbars = jest.fn(() => ({ update, destroy }));

jest.mock('overlayscrollbars', () => ({
	OverlayScrollbars: (...args: unknown[]) => (overlayScrollbars as (...a: unknown[]) => unknown)(...args),
}));

let notifyResize: () => void = () => undefined;
const observed: Element[] = [];

beforeEach(() => {
	jest.clearAllMocks();
	observed.length = 0;
	global.ResizeObserver = class {
		constructor(callback: ResizeObserverCallback) {
			notifyResize = () => callback([], this);
		}

		observe(element: Element) {
			observed.push(element);
		}

		disconnect() {
			observed.length = 0;
		}

		unobserve() {
			return undefined;
		}
	};
});

const Viewport = () => {
	const ref = useViewportScrollbars();
	return (
		<div data-testid='host'>
			<div ref={ref} data-testid='viewport'>
				<div data-testid='content' />
			</div>
		</div>
	);
};

it('draws the scrollbars on the viewport it is given, around its parent (message-list R78)', () => {
	render(<Viewport />);

	expect(overlayScrollbars).toHaveBeenCalledWith(
		{ target: screen.getByTestId('host'), elements: { viewport: screen.getByTestId('viewport') } },
		expect.anything(),
	);
});

it('updates the scrollbars when the content grows (message-list R78)', () => {
	render(<Viewport />);

	expect(observed).toContain(screen.getByTestId('content'));
	notifyResize();

	expect(update).toHaveBeenCalledTimes(1);
});

it('destroys the scrollbars and stops observing when the viewport unmounts (message-list R78)', () => {
	const { unmount } = render(<Viewport />);

	unmount();

	expect(destroy).toHaveBeenCalledTimes(1);
	expect(observed).toHaveLength(0);
});
