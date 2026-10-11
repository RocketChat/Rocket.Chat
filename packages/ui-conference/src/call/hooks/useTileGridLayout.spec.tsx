import { act, render, screen } from '@testing-library/react';

import { useTileGridLayout } from './useTileGridLayout';

const observe = jest.fn();
const disconnect = jest.fn();
let onResize: () => void = () => undefined;

beforeAll(() => {
	Object.defineProperty(window, 'ResizeObserver', {
		configurable: true,
		value: jest.fn((callback: () => void) => {
			onResize = callback;
			return { observe, disconnect };
		}),
	});
});

beforeEach(() => {
	jest.clearAllMocks();
});

const Grid = ({ shown }: { shown: boolean }) => {
	const [ref, layoutFor] = useTileGridLayout();
	const { cols } = layoutFor(4);
	return shown ? <div ref={ref} data-testid='grid' data-cols={cols} /> : null;
};

it('watches the element it is put on, and lets it go when it is gone', () => {
	const { rerender } = render(<Grid shown />);

	expect(observe).toHaveBeenCalledWith(screen.getByTestId('grid'));

	rerender(<Grid shown={false} />);
	expect(disconnect).toHaveBeenCalledTimes(1);
});

// Four tiles are a row while unmeasured, and a square once the element turns out to be one.
it('lays the grid out again when the element resizes', () => {
	render(<Grid shown />);
	const grid = screen.getByTestId('grid');
	expect(grid).toHaveAttribute('data-cols', '4');

	jest.spyOn(grid, 'getBoundingClientRect').mockReturnValue({ width: 800, height: 800 } as DOMRect);
	act(() => onResize());

	expect(grid).toHaveAttribute('data-cols', '2');
});
