import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import React, { ReactElement } from 'react';
import { createPortal } from 'react-dom';

import VerticalBar from '../../../../../components/VerticalBar';
import { createAnchor } from '../../../../../lib/utils/createAnchor';
import { useWebRTC } from '../../../hooks/useWebRTC';
import UserWebRTC from './UserWebRTC';
import UserWebRTCButtons from './UserWebRTCButtons';

const UserWebRTCWithData = (props: { rid: IRoom['_id']; peerName: IUser['username'] }): ReactElement => {
	const webRTCData = useWebRTC(props.rid);
	const { overlayEnabled } = webRTCData;

	const videoOverlay = css`
		position: fixed;
		z-index: 1000;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;

		display: flex;
		overflow-y: auto;
		flex-direction: column;

		padding: var(--default-small-padding);

		background-color: ${colors.white};
	`;

	if (overlayEnabled) {
		return createPortal(
			<Box className={videoOverlay}>
				<UserWebRTC {...props} webRTCData={webRTCData} />
				{webRTCData.isVideoActive() && <UserWebRTCButtons webRTCData={webRTCData} />}
			</Box>,
			createAnchor('react-webrtc'),
		);
	}

	return (
		<>
			<VerticalBar.ScrollableContent>
				<UserWebRTC {...props} webRTCData={webRTCData} />
			</VerticalBar.ScrollableContent>
			{webRTCData.isVideoActive() && (
				<VerticalBar.Footer>
					<UserWebRTCButtons webRTCData={webRTCData} />
				</VerticalBar.Footer>
			)}
		</>
	);
};

export default UserWebRTCWithData;
