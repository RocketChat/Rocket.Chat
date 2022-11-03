import { Box, IconButton } from '@rocket.chat/fuselage';
import { useCustomSound, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, ReactElement } from 'react';

import { GenericTableCell } from '../../../components/GenericTable/V2/GenericTableCell';
import { GenericTableRow } from '../../../components/GenericTable/V2/GenericTableRow';

type CustomSoundRowProps = {
	onClick: (soundId: string) => void;
	sound: {
		name: string;
		_id: string;
	};
};

const CustomSoundRow = ({ onClick, sound }: CustomSoundRowProps): ReactElement => {
	const t = useTranslation();
	const [isPlay, setPlayAudio] = useState(false);
	const customSound = useCustomSound();

	const handleToggle = useCallback(
		(sound) => {
			setPlayAudio(!isPlay);
			if (!isPlay) {
				return customSound.play(sound);
			}

			return customSound.pause(sound);
		},
		[customSound, isPlay],
	);
	// return (
	// 	<TableRow key={_id} onKeyDown={onClick(_id, sound)} onClick={onClick(_id, sound)} tabIndex={0} role='link' action qa-user-id={_id}>
	// 		<TableCell fontScale='p2' color='default'>
	// 			<Box withTruncatedText>{name}</Box>
	// 		</TableCell>
	// 		<TableCell alignItems={'end'}>
	// 			{!isPlay ? (
	// 				<Button ghost small square aria-label={t('Play')} onClick={(e) => e.preventDefault() & e.stopPropagation() & handleToggle(_id)}>
	// 					<Icon name='play' size='x20' />
	// 				</Button>
	// 			) : (
	// 				<Button ghost small square aria-label={t('Pause')} onClick={(e) => e.preventDefault() & e.stopPropagation() & handleToggle(_id)}>
	// 					<Icon name='pause' size='x20' />
	// 				</Button>
	// 			)}
	// 		</TableCell>
	// 	</TableRow>
	// );

	return (
		<GenericTableRow
			key={sound._id}
			onKeyDown={(): void => onClick(sound._id)}
			onClick={(): void => onClick(sound._id)}
			tabIndex={0}
			role='link'
			action
			qa-emoji-id={sound._id}
		>
			<GenericTableCell fontScale='p1' color='default'>
				<Box withTruncatedText>{sound.name}</Box>
			</GenericTableCell>
			<GenericTableCell>
				<IconButton
					icon={!isPlay ? 'pause' : 'play'}
					small
					aria-label={!isPlay ? t('Pause') : t('Play')}
					onClick={(e): void => {
						e.preventDefault();
						e.stopPropagation();
						handleToggle(sound._id);
					}}
				/>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default CustomSoundRow;
