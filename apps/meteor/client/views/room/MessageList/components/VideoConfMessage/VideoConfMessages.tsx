import { Button } from '@rocket.chat/fuselage';
import { VideoConfMessage, VideoConfMessageIcon, VideoConfMessageRow, VideoConfMessageText } from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

const VideoConfMessages = (): ReactElement => {
	console.log('videconfmessage');

	return (
		<VideoConfMessage>
			<VideoConfMessageRow>
				<VideoConfMessageIcon name='phone-off' backgroundColor='neutral-400' color='neutral-700' />
				<VideoConfMessageText fontScale='c2'>Call ended</VideoConfMessageText>
			</VideoConfMessageRow>
			<VideoConfMessageRow backgroundColor='neutral-100'>
				<Button small secondary>
					Call back
				</Button>
				<VideoConfMessageText>Call was not answered</VideoConfMessageText>
			</VideoConfMessageRow>
		</VideoConfMessage>
	);
};

export default VideoConfMessages;
