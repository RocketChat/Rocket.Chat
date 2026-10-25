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
