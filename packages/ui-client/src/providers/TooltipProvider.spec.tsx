/* oxlint-disable testing-library/prefer-user-event */
import { act, fireEvent, render, screen } from '@testing-library/react';

import TooltipProvider from './TooltipProvider';

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

const setup = () => {
	render(
		<TooltipProvider>
			<button type='button' title='Hello'>
				anchor
			</button>
		</TooltipProvider>,
	);

	return {
		anchor: screen.getByRole('button', { name: 'anchor' }),
	};
};

const waitForTooltipDebounce = () => {
	act(() => {
		jest.advanceTimersByTime(300);
	});
};

it('should show the tooltip on hover and stash the title attribute', () => {
	const { anchor } = setup();

	fireEvent.mouseOver(anchor);
	waitForTooltipDebounce();

	expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Hello');
	expect(anchor).toHaveAttribute('title', '');
	expect(anchor).toHaveAttribute('data-title', 'Hello');
});

it('should restore the title attribute on unhover without depending on timers', () => {
	const { anchor } = setup();

	fireEvent.mouseOver(anchor);
	waitForTooltipDebounce();
	fireEvent.mouseLeave(anchor);

	// the title must be restored synchronously on unmount, before any timer runs; otherwise a still-attached
	// MutationObserver can blank it again, permanently suppressing the tooltip for this element
	expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
	expect(anchor).toHaveAttribute('title', 'Hello');
	expect(anchor).not.toHaveAttribute('data-title');
});

it('should show the tooltip again after a full close and reopen cycle', () => {
	const { anchor } = setup();

	fireEvent.mouseOver(anchor);
	waitForTooltipDebounce();
	fireEvent.mouseLeave(anchor);
	act(() => {
		jest.runOnlyPendingTimers();
	});
	expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();

	fireEvent.mouseOver(anchor);
	waitForTooltipDebounce();

	expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Hello');
});

it('should update the tooltip and re-stash the title when it changes while open', async () => {
	const { anchor } = setup();

	fireEvent.mouseOver(anchor);
	waitForTooltipDebounce();

	// the MutationObserver callback runs as a microtask, so the update must be flushed asynchronously
	await act(async () => {
		anchor.setAttribute('title', 'World');
	});

	expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('World');
	expect(anchor).toHaveAttribute('title', '');
	expect(anchor).toHaveAttribute('data-title', 'World');
});

describe('click-dismiss while still hovering', () => {
	it('should keep the title stashed after a click-dismiss while the cursor is still on the anchor', () => {
		const { anchor } = setup();

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();
		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Hello');

		fireEvent.click(anchor);

		expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
		expect(anchor).toHaveAttribute('title', '');
		expect(anchor).toHaveAttribute('data-title', 'Hello');
	});

	it('should restore the title when the cursor leaves after a click-dismiss', () => {
		const { anchor } = setup();

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();
		fireEvent.click(anchor);

		fireEvent.mouseLeave(anchor);

		expect(anchor).toHaveAttribute('title', 'Hello');
		expect(anchor).not.toHaveAttribute('data-title');
	});

	it('should show the tooltip again after a click-dismiss and mouseleave cycle', () => {
		const { anchor } = setup();

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();
		fireEvent.click(anchor);
		fireEvent.mouseLeave(anchor);
		act(() => {
			jest.runOnlyPendingTimers();
		});

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Hello');
	});
});

describe('with a `data-tooltip`-only anchor', () => {
	const setupDataTooltip = () => {
		render(
			<TooltipProvider>
				<button type='button' data-tooltip='Hello'>
					anchor
				</button>
			</TooltipProvider>,
		);

		return {
			anchor: screen.getByRole('button', { name: 'anchor' }),
		};
	};

	it('should show the tooltip without ever adding a title attribute', () => {
		const { anchor } = setupDataTooltip();

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Hello');
		expect(anchor).not.toHaveAttribute('title');
		expect(anchor).not.toHaveAttribute('data-title');

		fireEvent.mouseLeave(anchor);

		// the anchor must not gain a native title on close; that would leak the tooltip text to the browser's tooltip
		expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
		expect(anchor).not.toHaveAttribute('title');
		expect(anchor).not.toHaveAttribute('data-title');
	});

	it('should update the tooltip when `data-tooltip` changes while open', async () => {
		const { anchor } = setupDataTooltip();

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();

		// the MutationObserver callback runs as a microtask, so the update must be flushed asynchronously
		await act(async () => {
			anchor.setAttribute('data-tooltip', 'World');
		});

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('World');
		expect(anchor).not.toHaveAttribute('title');
	});

	it('should show the tooltip again after a click-dismiss and mouseleave cycle', () => {
		const { anchor } = setupDataTooltip();

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();
		fireEvent.click(anchor);
		fireEvent.mouseLeave(anchor);
		act(() => {
			jest.runOnlyPendingTimers();
		});

		fireEvent.mouseOver(anchor);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Hello');
		expect(anchor).not.toHaveAttribute('title');
	});
});

describe('with an anchor covered by a link stretched over its row', () => {
	// jsdom has no layout: the link's box holds only its text, its stretched pseudo-element covers the row, and the
	// badge sits at x = 100
	const onText = { clientX: 10, clientY: 10 };
	const onBadge = { clientX: 100, clientY: 10 };

	const setupStretchedLink = () => {
		render(
			<TooltipProvider>
				<div data-testid='row'>
					<a href='#room'>Room</a>
					<span data-testid='badge' title='3 unread messages'>
						3
					</span>
				</div>
			</TooltipProvider>,
		);

		const row = screen.getByTestId('row');
		const link = screen.getByRole('link');
		const badge = screen.getByTestId('badge');

		Object.defineProperty(link, 'offsetParent', { value: row });
		link.getBoundingClientRect = () => new DOMRect(0, 0, 50, 20);
		document.elementsFromPoint = jest.fn((x: number) => (x === onBadge.clientX ? [link, badge, row] : [link, row]));

		return { link, badge };
	};

	afterEach(() => {
		// @ts-expect-error - jsdom does not implement it, so the tests define it
		delete document.elementsFromPoint;
	});

	it('should show the tooltip of the content under the pointer', () => {
		const { link, badge } = setupStretchedLink();

		fireEvent.mouseOver(link, onBadge);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('3 unread messages');
		expect(badge).toHaveAttribute('data-title', '3 unread messages');
	});

	it('should show the tooltip when the pointer moves onto the content within the link', () => {
		const { link } = setupStretchedLink();

		fireEvent.mouseOver(link, onText);
		fireEvent.mouseMove(link, onBadge);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('3 unread messages');
	});

	it('should close the tooltip when the pointer moves off the content within the link', () => {
		const { link, badge } = setupStretchedLink();

		fireEvent.mouseOver(link, onBadge);
		waitForTooltipDebounce();
		fireEvent.mouseMove(link, onText);

		expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
		expect(badge).toHaveAttribute('title', '3 unread messages');
	});

	it('should close the tooltip and restore the title when the pointer leaves the link', () => {
		const { link, badge } = setupStretchedLink();

		fireEvent.mouseOver(link, onBadge);
		waitForTooltipDebounce();
		fireEvent.mouseLeave(link);

		expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
		expect(badge).toHaveAttribute('title', '3 unread messages');
	});

	it('should restore the title when the pointer leaves the link after a click-dismiss', () => {
		const { link, badge } = setupStretchedLink();

		fireEvent.mouseOver(link, onBadge);
		waitForTooltipDebounce();
		fireEvent.click(link);
		fireEvent.mouseLeave(link);

		expect(badge).toHaveAttribute('title', '3 unread messages');
		expect(badge).not.toHaveAttribute('data-title');
	});

	it('should leave the click to the link', () => {
		const { link } = setupStretchedLink();

		fireEvent.mouseOver(link, onBadge);
		waitForTooltipDebounce();

		// `fireEvent` returns false when a listener prevented the default action
		expect(fireEvent.click(link, onBadge)).toBe(true);
	});

	it('should show the tooltip again after a click-dismiss when the pointer moves off and back within the link', () => {
		const { link } = setupStretchedLink();

		fireEvent.mouseOver(link, onBadge);
		waitForTooltipDebounce();
		fireEvent.click(link);
		fireEvent.mouseMove(link, onText);
		fireEvent.mouseMove(link, onBadge);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('3 unread messages');
	});

	it('should find the covered content after the link resizes while hovered', () => {
		const { link } = setupStretchedLink();

		// the link spans the badge's position when hovered, then shrinks as the row reveals its actions
		link.getBoundingClientRect = () => new DOMRect(0, 0, 200, 20);
		fireEvent.mouseOver(link, onText);
		link.getBoundingClientRect = () => new DOMRect(0, 0, 50, 20);
		fireEvent.mouseMove(link, onBadge);
		waitForTooltipDebounce();

		expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('3 unread messages');
	});
});
