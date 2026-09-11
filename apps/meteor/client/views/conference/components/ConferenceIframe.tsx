import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

type ConferenceIframeProps = {
	url: string;
	/** Exposes the provider's window, so messages it posts back can be attributed to this frame. */
	ref?: Ref<HTMLIFrameElement>;
};

const ConferenceIframe = ({ url, ref }: ConferenceIframeProps) => {
	const { t } = useTranslation();

	return (
		// `aria-label` names the frame instead of `title`. A `title` on a full-viewport iframe also renders
		// as a hover tooltip, floating a label over the call for as long as the pointer is inside it.
		// eslint-disable-next-line jsx-a11y/iframe-has-title
		<iframe
			ref={ref}
			style={{ width: '100%', height: '100%', flexGrow: 1 }}
			aria-label={t('Video_Conference')}
			src={url}
			allow='camera; microphone; display-capture; fullscreen; autoplay; speaker-selection; clipboard-write; clipboard-read; compute-pressure'
			allowFullScreen
			referrerPolicy='strict-origin-when-cross-origin'
		/>
	);
};

export default ConferenceIframe;
