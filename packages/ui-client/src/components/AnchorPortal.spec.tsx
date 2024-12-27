import { render, screen } from '@testing-library/react';

import AnchorPortal from './AnchorPortal';

it('should render children', () => {
	render(<AnchorPortal id='test-anchor' children={<div role='presentation' aria-label='example' />} />, { legacyRoot: true });

	expect(screen.getByRole('presentation', { name: 'example' })).toBeInTheDocument();
});

it('should not recreate the anchor element', () => {
	render(<AnchorPortal id='test-anchor' children={<div role='presentation' aria-label='example A' />} />, { legacyRoot: true });
	const anchorA = document.getElementById('test-anchor');

	render(<AnchorPortal id='test-anchor' children={<div role='presentation' aria-label='example B' />} />, { legacyRoot: true });
	const anchorB = document.getElementById('test-anchor');

	expect(anchorA).toBe(anchorB);
	expect(screen.getByRole('presentation', { name: 'example A' })).toBeInTheDocument();
	expect(screen.getByRole('presentation', { name: 'example B' })).toBeInTheDocument();
});

it('should remove the anchor element when unmounted', () => {
	const { unmount } = render(<AnchorPortal id='test-anchor' children={<div role='presentation' aria-label='example' />} />, {
		legacyRoot: true,
	});
	expect(document.getElementById('test-anchor')).toBeInTheDocument();

	unmount();
	expect(document.getElementById('test-anchor')).not.toBeInTheDocument();
});

it('should not remove the anchor element after unmounting if there are other portals with the same id', () => {
	const { unmount } = render(<AnchorPortal id='test-anchor' children={<div role='presentation' aria-label='example' />} />, {
		legacyRoot: true,
	});
	expect(document.getElementById('test-anchor')).toBeInTheDocument();

	render(<AnchorPortal id='test-anchor' children={<div role='presentation' aria-label='example' />} />, {
		legacyRoot: true,
	});
	unmount();

	expect(document.getElementById('test-anchor')).toBeInTheDocument();
});
