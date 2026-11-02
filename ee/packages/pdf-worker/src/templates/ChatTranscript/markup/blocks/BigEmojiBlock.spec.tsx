import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import BigEmojiBlock from './BigEmojiBlock';

jest.mock('@react-pdf/renderer', () => ({
	Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

it.each([undefined, '\n', '\r\n', '\r', '\n\n'])('preserves separator %j in transcript text', (separator) => {
	const { container } = render(
		<BigEmojiBlock
			emoji={[
				{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
				{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'heart' }, shortCode: 'heart' },
			]}
			separators={separator === undefined ? undefined : [separator]}
		/>,
	);

	expect(container.textContent).toBe(`:smile:${separator?.replace(/\r\n|\r/g, '\n') ?? ''}:heart:`);
});
