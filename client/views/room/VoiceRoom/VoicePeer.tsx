import { Box, Button, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useRef, useEffect, useState } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { analyseAudio } from './util';

interface IProps extends IVoiceRoomPeer {
	globalDeafen?: boolean;
}

const VoicePeer: FC<IProps> = ({
	id,
	displayName,
	track,
	username,
	deafen,
	disableDeafenControls,
	globalDeafen,
}): ReactElement => {
	const ref = useRef<HTMLAudioElement>(null);
	const [muted, setMuted] = useState(false);
	const [speaking, setSpeaking] = useState<boolean>(false);

	const runAudioAnalyser = (s: MediaStream): void => {
		const speechEvents = analyseAudio(s);
		speechEvents.on('speaking', () => {
			setSpeaking(true);
		});

		speechEvents.on('stopped_speaking', () => {
			setSpeaking(false);
		});
	};

	useEffect(() => {
		if (track) {
			const stream = new MediaStream();
			stream.addTrack(track);

			runAudioAnalyser(stream);

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
		<Box textAlign='center' justifyContent='center' id={id} padding='x16'>
			<Box
				padding='0.2em'
				borderWidth='unset'
				borderColor={speaking ? 'var(--rc-color-success)' : 'transparent'}
			>
				<UserAvatar size='x124' username={username || ''} />
			</Box>
			<audio ref={ref} muted={muted || deafen || globalDeafen} autoPlay />
			<p>{displayName}</p>
			{track && !disableDeafenControls && (
				<Button onClick={toggleMute}>
					{muted ? <Icon name='volume-off' size='x24' /> : <Icon name='volume' size='x24' />}
				</Button>
			)}
		</Box>
	);
};

export default VoicePeer;
