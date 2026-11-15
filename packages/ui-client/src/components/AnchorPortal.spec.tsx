/* eslint-disable testing-library/no-node-access */
import { render, screen } from '@testing-library/react';

import AnchorPortal from './AnchorPortal';

it('should render children', () => {
	render(
		<AnchorPortal id='test-anchor'>
			<div role='presentation' aria-label='example' />
		</AnchorPortal>,
	);

	expect(screen.getByRole('presentation', { name: 'example' })).toBeInTheDocument();
});

it('should not recreate the anchor element', () => {
	const { baseElement } = render(
		<AnchorPortal id='test-anchor'>
			<div role='presentation' aria-label='example A' />
		</AnchorPortal>,
	);
	const anchorA = baseElement.querySelector('#test-anchor');

	render(
		<AnchorPortal id='test-anchor'>
			<div role='presentation' aria-label='example B' />
		</AnchorPortal>,
	);
	const anchorB = baseElement.querySelector('#test-anchor');

	expect(anchorA).toBe(anchorB);
	expect(screen.getByRole('presentation', { name: 'example A' })).toBeInTheDocument();
	expect(screen.getByRole('presentation', { name: 'example B' })).toBeInTheDocument();
});

it('should remove the anchor element when unmounted', () => {
	const { baseElement, unmount } = render(
		<AnchorPortal id='test-anchor'>
			<div role='presentation' aria-label='example' />
		</AnchorPortal>,
	);
	expect(baseElement.querySelector('#test-anchor')).toBeInTheDocument();

	unmount();
	expect(baseElement.querySelector('#test-anchor')).not.toBeInTheDocument();
});

it('should not remove the anchor element after unmounting if there are other portals with the same id', () => {
	const { baseElement, unmount } = render(
		<AnchorPortal id='test-anchor'>
			<div role='presentation' aria-label='example' />
		</AnchorPortal>,
	);
	expect(baseElement.querySelector('#test-anchor')).toBeInTheDocument();

	render(
		<AnchorPortal id='test-anchor'>
			<div role='presentation' aria-label='example' />
		</AnchorPortal>,
	);
	unmount();

	expect(baseElement.querySelector('#test-anchor')).toBeInTheDocument();
});
