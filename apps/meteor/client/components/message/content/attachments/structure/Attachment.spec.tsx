import { render } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

jest.mock('@rocket.chat/fuselage', () => ({
	Box: ({ children, width, maxWidth }: { children?: ReactNode; width?: unknown; maxWidth?: unknown }) =>
		createElement(
			'div',
			{
				'data-box-width': width,
				'data-box-max-width': maxWidth,
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
