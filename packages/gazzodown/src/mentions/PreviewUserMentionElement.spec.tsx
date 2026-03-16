import { render } from '@testing-library/react';

import PreviewUserMentionElement from './PreviewUserMentionElement';

describe('PreviewUserMentionElement', () => {
	it('renders user mention with @ prefix', () => {
		const { container } = render(<PreviewUserMentionElement mention='john.doe' />);
		expect(container).toHaveTextContent('@john.doe');
	});

	it('renders different usernames', () => {
		const { container } = render(<PreviewUserMentionElement mention='admin' />);
		expect(container).toHaveTextContent('@admin');
	});

	it('matches snapshot', () => {
		const { container } = render(<PreviewUserMentionElement mention='rocket.cat' />);
		expect(container).toMatchSnapshot();
	});
});
