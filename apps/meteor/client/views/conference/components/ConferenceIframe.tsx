import { Box } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LoadingIndicator from '../../../components/LoadingIndicator';

type ConferenceIframeProps = {
	url: string;
	/** Exposes the provider's window, so messages it posts back can be attributed to this frame. */
	ref?: Ref<HTMLIFrameElement>;
};

/**
 * The provider's own page, and something to look at until it has one.
 *
 * A provider takes seconds to come up and an iframe shows nothing at all meanwhile, so the window sat black and
 * still — which reads as a call that failed rather than one arriving. The wait is covered here rather than by
 * the page around it, because the page has nothing left to wait for: the join has already answered, and the
 * only thing that knows the provider has arrived is this frame.
 */
const ConferenceIframe = ({ url, ref }: ConferenceIframeProps) => {
	const { t } = useTranslation();

	const [loading, setLoading] = useState(true);

	// A different address is a different page to wait for.
	useEffect(() => setLoading(true), [url]);

	return (
		// Black, and on the frame itself as well as behind it: it is what a provider letterboxes its video
		// against, and what shows through wherever the provider's own page is transparent. The window's surface
		// colour in those bands would read as a rendering fault rather than as a call.
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} minHeight={0} style={{ backgroundColor: '#000' }}>
			{/* `aria-label` names the frame instead of `title`. A `title` on a full-viewport iframe also renders
			    as a hover tooltip, floating a label over the call for as long as the pointer is inside it. */}
			{/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
			<iframe
				ref={ref}
				style={{ width: '100%', height: '100%', flexGrow: 1, backgroundColor: '#000' }}
				aria-label={t('Video_Conference')}
				src={url}
				allow='camera; microphone; display-capture; fullscreen; autoplay; speaker-selection; clipboard-write; clipboard-read; compute-pressure'
				allowFullScreen
				referrerPolicy='strict-origin-when-cross-origin'
				onLoad={() => setLoading(false)}
			/>

			{loading && (
				// Over the frame rather than behind it, which is the only side it can be seen from: the frame
				// paints its own black from the first render, so anything underneath would never show.
				//
				// `pointer-events: none` because it covers the whole frame, and the moment the provider is worth
				// clicking is the moment before this goes away.
				<Box
					role='status'
					position='absolute'
					display='flex'
					flexDirection='column'
					alignItems='center'
					justifyContent='center'
					gap={16}
					style={{ inset: 0, pointerEvents: 'none' }}
				>
					<LoadingIndicator />
					<Box color='hint' fontScale='p2'>
						{t('Loading_conference_provider')}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default ConferenceIframe;
