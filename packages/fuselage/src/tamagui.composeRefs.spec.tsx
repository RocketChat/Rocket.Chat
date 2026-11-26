import { composeRefs, styled, View } from '@tamagui/web';
import { render, screen } from '@testing-library/react';
import type { ReactNode, Ref } from 'react';
import { createRef } from 'react';

import './tamagui.config';

const Frame = styled(View, { render: 'div' });

const Row = ({ elementRef, tick }: { elementRef: Ref<HTMLElement>; tick: number }): ReactNode => (
	<Frame render={<div ref={elementRef as Ref<HTMLDivElement>} data-testid='el' data-tick={tick} />} />
);

describe('a ref on the render element of a frame', () => {
	it('is attached once for a stable callback ref, however often the parent renders', () => {
		const calls: (string | null)[] = [];
		const ref = (node: HTMLElement | null) => {
			calls.push(node ? 'el' : null);
		};

		const { rerender } = render(<Row elementRef={ref} tick={0} />);
		rerender(<Row elementRef={ref} tick={1} />);
		rerender(<Row elementRef={ref} tick={2} />);

		expect(screen.getByTestId('el')).toHaveAttribute('data-tick', '2');
		expect(calls).toEqual(['el']);
	});

	it('is detached when the frame unmounts', () => {
		const calls: (string | null)[] = [];
		const ref = (node: HTMLElement | null) => {
			calls.push(node ? 'el' : null);
		};

		const { unmount } = render(<Row elementRef={ref} tick={0} />);
		unmount();

		expect(calls).toEqual(['el', null]);
	});

	it('is attached to the element for an object ref', () => {
		const ref = createRef<HTMLElement>();

		render(<Row elementRef={ref} tick={0} />);

		expect(ref.current).toBe(screen.getByTestId('el'));
	});

	it('is attached to the element for an inline callback ref', () => {
		const seen: (HTMLElement | null)[] = [];

		render(<Row elementRef={(node) => void seen.push(node)} tick={0} />);

		expect(seen[0]).toBe(screen.getByTestId('el'));
	});
});

describe('composeRefs', () => {
	it('returns the same function for the same refs', () => {
		const a = () => undefined;
		const b = createRef<HTMLElement>();

		expect(composeRefs(a, b)).toBe(composeRefs(a, b));
		expect(composeRefs(a, undefined)).toBe(composeRefs(a, undefined));
		expect(composeRefs(a, b)).not.toBe(composeRefs(b, a));
		expect(composeRefs(a)).not.toBe(composeRefs(a, undefined));
	});

	it('returns a new function for an inline ref', () => {
		expect(composeRefs(() => undefined, createRef())).not.toBe(composeRefs(() => undefined, createRef()));
	});

	it('sets every ref on each node the shared function is attached to', () => {
		const a = createRef<HTMLElement>();
		const calls: (HTMLElement | null)[] = [];
		const b = (node: HTMLElement | null) => void calls.push(node);
		const composed: (node: HTMLElement) => unknown = composeRefs(a, b);
		const first = document.createElement('div');
		const second = document.createElement('div');

		const cleanupFirst = composed(first);
		const cleanupSecond = composed(second);
		expect(a.current).toBe(second);

		[cleanupSecond, cleanupFirst].forEach((cleanup) => typeof cleanup === 'function' && cleanup());
		expect(a.current).toBeNull();
		expect(calls).toEqual([first, second, null, null]);
	});
});
