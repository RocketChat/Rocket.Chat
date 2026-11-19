import { createRef } from 'react';

import Position from './Position';
import { render } from '../../testing';

test('keeps the style of the positioned element', () => {
	const anchor = createRef<HTMLDivElement>();

	render(
		<>
			<div ref={anchor} />
			<Position anchor={anchor}>
				<div data-testid='positioned' style={{ width: 120 }} />
			</Position>
		</>,
	);

	const positioned = document.querySelector<HTMLElement>('[data-testid="positioned"]');
	expect(positioned?.style.width).toBe('120px');
	expect(positioned?.style.position).toBe('fixed');
});

test('unmounts together with another positioned element', () => {
	const anchor = createRef<HTMLDivElement>();

	const { unmount } = render(
		<>
			<div ref={anchor} />
			<Position anchor={anchor}>
				<div />
			</Position>
			<Position anchor={anchor}>
				<div />
			</Position>
		</>,
	);

	expect(unmount).not.toThrow();
	expect(document.getElementById('position-container')).toBeNull();
});

test('gives the positioned element the width of its anchor when asked to', () => {
	const anchor = createRef<HTMLDivElement>();
	const tree = (positioned: boolean) => (
		<>
			<div ref={anchor} />
			{positioned && (
				<Position anchor={anchor} width='anchor'>
					<div data-testid='as-wide' />
				</Position>
			)}
			{positioned && (
				<Position anchor={anchor}>
					<div data-testid='own-width' />
				</Position>
			)}
		</>
	);

	const { rerender } = render(tree(false));
	Object.defineProperty(anchor.current, 'offsetWidth', { value: 240 });
	rerender(tree(true));

	expect(document.querySelector<HTMLElement>('[data-testid="as-wide"]')?.style.width).toBe('240px');
	expect(document.querySelector<HTMLElement>('[data-testid="own-width"]')?.style.width).toBe('');
});
