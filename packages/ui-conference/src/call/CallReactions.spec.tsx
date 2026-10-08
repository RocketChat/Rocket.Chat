import { render } from '@testing-library/react';

import CallReactions from './CallReactions';

const burst = Array.from({ length: 8 }, (_, index) => ({ id: String(index), emoji: '👍', name: `Member ${index}` }));

// A burst stacks the oldest reactions higher than the newest; each still has to rise and fade out whole.
it('does not cut off reactions stacked above the newest', () => {
	const { container } = render(<CallReactions reactions={burst} />);

	const layer = container.querySelector('[aria-live]') as HTMLElement;
	const { overflow, height } = getComputedStyle(layer);

	expect(overflow).not.toBe('hidden');
	expect(height).not.toMatch(/rem$/);
});
