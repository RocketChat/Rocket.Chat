import type { VideoConference, VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import React, { ReactElement, useEffect, useState } from 'react';

import { getURL } from '../../../../../app/utils/client';

const VideoConfWrapper = (props: Omit<VideoConference, 'providerData'> & { capabilities: VideoConferenceCapabilities }): ReactElement => {
	const [sdkState, setSdkState] = useState('none');

	useEffect(() => {
		if (props.providerName !== 'pexip') {
			setSdkState('skipped');
			return;
		}

		const pexipScript = document.createElement('script');

		pexipScript.src = getURL('pexrtc.js');
		pexipScript.async = true;
		pexipScript.addEventListener('load', () => {
			setSdkState('loaded');
		});

		pexipScript.addEventListener('error', () => {
			setSdkState('error');
		});

		document.body.appendChild(pexipScript);
	}, [props.providerName]);

	if (sdkState === 'none') {
		return <div>Loading</div>;
	}

	if (sdkState === 'error') {
		return <div>Failed to load SDK</div>;
	}

	return <iframe width='100%' height='100%' src={props.url} />;
};

export default VideoConfWrapper;
