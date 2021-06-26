import { Box, Button, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useRef, useEffect, useState } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import UserAvatar from '../../../components/avatar/UserAvatar';

const VoicePeer: FC<IVoiceRoomPeer> = ({
	id,
	displayName,
	track,
	username,
	deafen,
}): ReactElement => {
	const ref = useRef<HTMLAudioElement>(null);
	const [muted, setMuted] = useState(false);

	useEffect(() => {
		if (track) {
			const stream = new MediaStream();
			stream.addTrack(track);

			if (ref.current) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				ref.current!.srcObject = stream;
			}
		}
	}, [track]);

	const toggleMute = (): void => {
		setMuted((prev) => !prev);
	};

	return (
		<Box textAlign='center' alignItems='center' justifyContent='center' id={id} padding='x16'>
			<UserAvatar size='x124' username={username || ''} />
			<audio ref={ref} muted={muted || deafen} autoPlay />
			<p>{displayName}</p>
			{track && (
				<Button onClick={toggleMute}>
					{muted ? <Icon name='volume-off' size='x24' /> : <Icon name='volume' size='x24' />}
				</Button>
			)}
		</Box>
	);
};

export default VoicePeer;
