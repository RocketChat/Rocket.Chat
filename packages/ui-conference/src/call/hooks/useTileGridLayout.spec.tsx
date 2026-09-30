import { render } from '@testing-library/react';

import { useTileGridLayout } from './useTileGridLayout';

const observe = jest.fn();
const disconnect = jest.fn();

beforeAll(() => {
	Object.defineProperty(window, 'ResizeObserver', {
		configurable: true,
		value: jest.fn(() => ({ observe, disconnect })),
	});
});

beforeEach(() => {
	jest.clearAllMocks();
});

const Grid = ({ shown }: { shown: boolean }) => {
	const [ref, { cols }] = useTileGridLayout(4);
	return shown ? <div ref={ref} data-cols={cols} /> : null;
};

it('watches the element it is put on, and lets it go when it is gone', () => {
	const { container, rerender } = render(<Grid shown />);
	const node = container.firstElementChild;

	expect(observe).toHaveBeenCalledWith(node);

	rerender(<Grid shown={false} />);
	expect(disconnect).toHaveBeenCalledTimes(1);
});
