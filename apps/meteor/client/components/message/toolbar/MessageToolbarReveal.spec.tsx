import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { createRef } from 'react';

import MessageToolbarReveal, { messageToolbarScope } from './MessageToolbarReveal';

it('leaves the reveal to its stylesheet until it is forced visible', () => {
	const { container, rerender } = render(<MessageToolbarReveal />);

	// oxlint-disable-next-line testing-library/no-node-access -- the reveal wrapper has no role, label or text of its own
	expect(container.firstElementChild).toHaveClass('message-toolbar-reveal');

	// The class would keep a forced toolbar transparent while the pointer is away from the message.
	rerender(<MessageToolbarReveal visible />);
	// oxlint-disable-next-line testing-library/no-node-access -- the reveal wrapper has no role, label or text of its own
	expect(container.firstElementChild).not.toHaveClass('message-toolbar-reveal');
});

it('hands its element to the ref, for the visibility observer', () => {
	const ref = createRef<HTMLDivElement>();

	const { container } = render(<MessageToolbarReveal ref={ref} />);

	// oxlint-disable-next-line testing-library/no-node-access -- the reveal wrapper has no role, label or text of its own
	expect(ref.current).toBe(container.firstElementChild);
});

it('keys its stylesheet on the class the message rows carry', () => {
	const css = readFileSync(join(__dirname, 'MessageToolbarReveal.css'), 'utf8');

	expect(css).toContain(`.${messageToolbarScope}:hover .message-toolbar-reveal`);
	expect(css).toContain(`.${messageToolbarScope}:focus-within .message-toolbar-reveal`);
});
