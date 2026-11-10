import { render, screen } from '@testing-library/react';

import ContextualbarScrollableContent from './ContextualbarScrollableContent';

it('keeps the trailing gap when the caller passes a className', () => {
	render(<ContextualbarScrollableContent className='caller'>content</ContextualbarScrollableContent>);

	const withTrailingGap = screen.getByText('content');
	const withoutTrailingGap = (() => {
		render(<ContextualbarScrollableContent>plain</ContextualbarScrollableContent>);
		return screen.getByText('plain');
	})();

	expect(withTrailingGap).toHaveClass('caller');
	expect(withTrailingGap.className.split(' ').filter((name) => name.startsWith('rcx-css-')).length).toBeGreaterThanOrEqual(
		withoutTrailingGap.className.split(' ').filter((name) => name.startsWith('rcx-css-')).length,
	);
});
