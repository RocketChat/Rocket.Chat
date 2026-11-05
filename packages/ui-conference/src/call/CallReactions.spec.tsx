import { render } from '@testing-library/react';

import CallReactions from './CallReactions';

const burst = Array.from({ length: 8 }, (_, index) => ({ id: String(index), emoji: '👍', name: `Member ${index}` }));

// A burst stacks the oldest reactions higher than the newest; each still has to rise and fade out whole.
it('does not cut off reactions stacked above the newest', () => {
	const { container } = render(<CallReactions reactions={burst} />);

	// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the aria-live layer has no role or text of its own for a query to reach
	const layer = container.querySelector('[aria-live]') as HTMLElement;

	// Neither clipped, in any form, nor held to a height the stack can outgrow.
	expect(getComputedStyle(layer)).toMatchObject({ overflow: '', height: '' });
});
