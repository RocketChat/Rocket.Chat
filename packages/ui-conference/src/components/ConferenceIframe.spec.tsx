import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';

import ConferenceIframe from './ConferenceIframe';

const renderFrame = (url = 'https://provider.example/meet/abc') =>
	render(<ConferenceIframe url={url} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withTranslations('en', 'core', { Loading_conference_provider: 'Loading conference provider', Video_Conference: 'Video Conference' })
			.build(),
	});

const frame = () => screen.getByLabelText('Video Conference');

// A provider takes seconds to come up and an iframe shows nothing while it does, so this is the whole of what
// the reader has to go on in the meantime.
it('says the provider is being loaded while the frame is still blank', () => {
	renderFrame();

	expect(screen.getByText('Loading conference provider')).toBeInTheDocument();
});

it('stops saying so once the provider has loaded', () => {
	renderFrame();

	fireEvent.load(frame());

	expect(screen.queryByText('Loading conference provider')).not.toBeInTheDocument();
});

// A new address is a new page to wait for — a provider swapped under a live window would otherwise show the
// last one's frame with nothing to say it is being replaced.
it('waits again when the address changes', () => {
	const { rerender } = renderFrame();

	fireEvent.load(frame());
	expect(screen.queryByText('Loading conference provider')).not.toBeInTheDocument();

	rerender(<ConferenceIframe url='https://provider.example/meet/other' />);

	expect(screen.getByText('Loading conference provider')).toBeInTheDocument();
});

// Black on the frame itself, not only behind it: whatever the provider leaves transparent shows this, and the
// window's own surface colour in those bands reads as a rendering fault rather than as a call.
it('paints the frame black, for whatever the provider leaves transparent', () => {
	renderFrame();

	expect(frame()).toHaveStyle({ backgroundColor: '#000' });
});
