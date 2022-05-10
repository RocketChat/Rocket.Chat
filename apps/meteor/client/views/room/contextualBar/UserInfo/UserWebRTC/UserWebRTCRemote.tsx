import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import UserWebRTCVideo from './UserWebRTCVideo';

export type UserWebRTCRemoteProps = {
	id?: string;
	url?: MediaStream;
	connected?: boolean;
	state?: string;
	stateText?: string;
	muted?: boolean;
	ownUser?: boolean;
	screen?: boolean | undefined;
	audioAndVideoEnabled: boolean;
	audioEnabled: boolean;
	videoEnabled: boolean;
	setMainVideo: (value: string) => void;
	peerName?: IUser['username'];
	overlayEnabled?: boolean;
};

const UserWebRTCRemote = (props: UserWebRTCRemoteProps): ReactElement => {
	const t = useTranslation();

	const {
		url,
		id,
		stateText,
		muted,
		ownUser,
		screen,
		audioAndVideoEnabled,
		audioEnabled,
		videoEnabled,
		setMainVideo,
		peerName = '',
		overlayEnabled,
	} = props;

	const userName = ownUser ? '$self' : peerName;

	const cursorPointer = css`
		cursor: pointer;
	`;

	const handleSetMainVideo = (): void => setMainVideo(userName);

	return (
		<Box
			width={overlayEnabled ? '15%' : '48%'}
			margin={overlayEnabled ? 'x8' : ''}
			className={cursorPointer}
			data-state-text={stateText}
			data-username={ownUser ? '$self' : id}
			key={id}
			onClick={handleSetMainVideo}
		>
			<UserWebRTCVideo videoEnabled={videoEnabled} ownUser={ownUser} muted={muted} url={url} screen={screen} />
			<Box display='flex' width='full' alignItems='center' justifyContent='center'>
				<Box margin='x4'>{ownUser ? t('You') : peerName}</Box>
				<Box>
					{ownUser && !audioAndVideoEnabled && (
						<>
							{!audioEnabled && <Icon size='x20' name='mic-off' />}
							{!videoEnabled && <Icon size='x20' name='eye-off' />}
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default UserWebRTCRemote;
