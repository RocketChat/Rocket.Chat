import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useWebRTCProps } from '../../../hooks/useWebRTC';
import UserWebRTCRemote from './UserWebRTCRemote';
import UserWebRTCVideo from './UserWebRTCVideo';

const UserWebRTC = ({ peerName, webRTCData }: { peerName: IUser['username']; webRTCData: useWebRTCProps }): ReactElement => {
	const t = useTranslation();

	const {
		mainVideoUrl,
		screenShareEnabled,
		selfVideoUrl,
		audioAndVideoEnabled,
		audioEnabled,
		videoEnabled,
		remoteVideoItems,
		setMainVideo,
		overlayEnabled,
	} = webRTCData;

	const isOwnUser = mainVideoUrl() === selfVideoUrl;

	return (
		<>
			<Box
				display='flex'
				flexWrap='wrap'
				textAlign='center'
				alignItems='center'
				justifyContent='center'
				maxWidth={overlayEnabled ? '30%' : 'unset'}
				margin={overlayEnabled ? '0 auto' : 'unset'}
			>
				<UserWebRTCVideo
					url={mainVideoUrl()}
					ownUser={isOwnUser}
					muted={true}
					screen={screenShareEnabled}
					isMainVideo
					videoEnabled={videoEnabled}
				/>
				<Box margin='x4'>{isOwnUser ? t('You') : peerName}</Box>
			</Box>

			<Box display='flex' justifyContent={overlayEnabled ? 'center' : 'space-between'}>
				{selfVideoUrl && (
					<UserWebRTCRemote
						url={selfVideoUrl}
						muted
						ownUser
						screen={screenShareEnabled}
						audioAndVideoEnabled={audioAndVideoEnabled}
						audioEnabled={audioEnabled}
						videoEnabled={videoEnabled}
						setMainVideo={setMainVideo}
						overlayEnabled={overlayEnabled}
					/>
				)}

				{remoteVideoItems.map(
					(remoteItem, index): ReactElement => (
						<UserWebRTCRemote
							{...remoteItem}
							key={index}
							peerName={peerName}
							setMainVideo={setMainVideo}
							overlayEnabled={overlayEnabled}
							audioAndVideoEnabled={audioAndVideoEnabled}
							audioEnabled={audioEnabled}
							videoEnabled={videoEnabled}
						/>
					),
				)}
			</Box>
		</>
	);
};

export default UserWebRTC;
