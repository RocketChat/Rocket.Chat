import { render } from '@testing-library/react';

import PreviewChannelMentionElement from './PreviewChannelMentionElement';

describe('PreviewChannelMentionElement', () => {
	it('renders channel mention with # prefix', () => {
		const { container } = render(<PreviewChannelMentionElement mention='general' />);
		expect(container).toHaveTextContent('#general');
	});

	it('renders different channel names', () => {
		const { container } = render(<PreviewChannelMentionElement mention='random-channel' />);
		expect(container).toHaveTextContent('#random-channel');
	});

	it('matches snapshot', () => {
		const { container } = render(<PreviewChannelMentionElement mention='announcements' />);
		expect(container).toMatchSnapshot();
	});
});
