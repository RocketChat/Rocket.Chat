import type { Ref } from 'react';

type ConferenceIframeProps = {
	url: string;
	/** Exposes the provider's window, so messages it posts back can be attributed to this frame. */
	ref?: Ref<HTMLIFrameElement>;
};

const ConferenceIframe = ({ url, ref }: ConferenceIframeProps) => (
	<iframe
		ref={ref}
		style={{ width: '100%', height: '100%', flexGrow: 1 }}
		title='external-frame'
		src={url}
		allow='camera; microphone; display-capture; fullscreen; autoplay; speaker-selection; clipboard-write; clipboard-read; compute-pressure'
		allowFullScreen
		referrerPolicy='strict-origin-when-cross-origin'
	/>
);

export default ConferenceIframe;
