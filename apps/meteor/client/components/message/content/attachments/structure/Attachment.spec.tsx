import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

jest.mock('@rocket.chat/fuselage', () => ({
	Box: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
		createElement(
			'div',
			{
				...props,
				'data-box-width': props.width,
				'data-box-max-width': props.maxWidth,
			},
			children,
		),
}));

import Attachment from './Attachment';

describe('Attachment', () => {
	it('does not constrain the attachment wrapper to the media preview width', () => {
		const { container } = render(<Attachment />);
		const element = container.firstElementChild;

		expect(element).toHaveAttribute('data-box-width', 'full');
		expect(element).not.toHaveAttribute('data-box-max-width');
	});
});
