import { render } from '@testing-library/react';

import { Tag } from '../Tag';

describe('Tamagui-based components', () => {
	it('run the cleanup a callback ref returns, instead of calling it with null', () => {
		const calls: unknown[] = [];
		const cleanup = jest.fn();
		const ref = (node: unknown) => {
			calls.push(node);
			return cleanup;
		};

		const { unmount } = render(<Tag ref={ref}>tag</Tag>);
		unmount();

		expect(calls).toHaveLength(1);
		expect(calls[0]).toBeInstanceOf(HTMLElement);
		expect(cleanup).toHaveBeenCalledTimes(1);
	});
});
