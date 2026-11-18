import { render, screen } from '@testing-library/react';

import { Element } from './ImageElement.styles';
import { Image } from '../blocks/ImageBlock.styles';

it.each([
	['image block', <Image key='block' imageUrl='https://example.com/a.png' width={100} height={50} data-testid='frame' />],
	['image element', <Element key='element' imageUrl='https://example.com/a.png' size={20} data-testid='frame' />],
])('frames the %s with Fuselage tokens', (_, node) => {
	render(node);
	const style = getComputedStyle(screen.getByTestId('frame'));

	expect(style.backgroundColor).toContain('--rcx-color-surface-tint');
	expect(style.borderColor).toContain('--rcx-color-stroke-extra-light');
	expect(style.boxShadow).toBe('');
});
