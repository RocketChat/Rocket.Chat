import { Box, Table, Icon, Button } from '@rocket.chat/fuselage';
import React, { useCallback, useState } from 'react';

import { useCustomSound } from '../../../contexts/CustomSoundContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const SoundRow = ({ onClick, sound }) => {
	const { _id, name } = sound;
	const [isPlay, setPlayAudio] = useState(false);
	const t = useTranslation();
	const customSound = useCustomSound();
	const handleToggle = useCallback(
		(sound) => {
			setPlayAudio(!isPlay);
			if (!isPlay) customSound.play(sound);
			else customSound.pause(sound);
		},
		[customSound, isPlay],
	);
	return (
		<Table.Row key={_id} onKeyDown={onClick(_id, sound)} onClick={onClick(_id, sound)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p2' color='default'>
				<Box withTruncatedText>{name}</Box>
			</Table.Cell>
			<Table.Cell alignItems={'end'}>
				{!isPlay ? (
					<Button ghost small square aria-label={t('Play')} onClick={(e) => e.preventDefault() & e.stopPropagation() & handleToggle(_id)}>
						<Icon name='play' size='x20' />
					</Button>
				) : (
					<Button ghost small square aria-label={t('Pause')} onClick={(e) => e.preventDefault() & e.stopPropagation() & handleToggle(_id)}>
						<Icon name='pause' size='x20' />
					</Button>
				)}
			</Table.Cell>
		</Table.Row>
	);
};

export default SoundRow;
