import { Box } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useRef, useEffect } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import UserAvatar from '../../../components/avatar/UserAvatar';

const PeerView: FC<IVoiceRoomPeer> = (props): ReactElement => {
	const { id, displayName, track, username } = props;
	const ref = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		const stream = new MediaStream();
		stream.addTrack(track);

		if (ref.current) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			ref.current!.srcObject = stream;
		}
	}, []);
	return (
		<Box textAlign='center' alignItems='center' justifyContent='center' id={id} padding='x16'>
			<UserAvatar size='x124' rounded username={username || ''} />
			<audio ref={ref} autoPlay />
			<p>{displayName}</p>
		</Box>
	);
};

export default PeerView;
