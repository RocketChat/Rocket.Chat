/* eslint-disable testing-library/prefer-user-event */
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
