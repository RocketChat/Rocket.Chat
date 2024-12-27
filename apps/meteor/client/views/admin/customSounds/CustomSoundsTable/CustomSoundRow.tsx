import type { ICustomSound } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableCell, GenericTableRow } from '../../../../components/GenericTable';

type CustomSoundRowProps = {
	onClick: (soundId: ICustomSound['_id']) => () => void;
	sound: {
		name: string;
		_id: string;
	};
};

const CustomSoundRow = ({ onClick, sound }: CustomSoundRowProps): ReactElement => {
	const { t } = useTranslation();
	const [isPlay, setPlayAudio] = useState(false);
	const customSound = useCustomSound();

	const handleToggle = useCallback(
		(sound: ICustomSound['_id']) => {
			setPlayAudio(!isPlay);
			if (!isPlay) {
				return customSound.play(sound);
			}

			return customSound.pause(sound);
		},
		[customSound, isPlay],
	);

	return (
		<GenericTableRow
			key={sound._id}
			onKeyDown={onClick(sound._id)}
			onClick={onClick(sound._id)}
			tabIndex={0}
			role='link'
			action
			qa-emoji-id={sound._id}
		>
			<GenericTableCell>
				<Box withTruncatedText>{sound.name}</Box>
			</GenericTableCell>
			<GenericTableCell>
				<IconButton
					icon={!isPlay ? 'play' : 'pause'}
					small
					aria-label={!isPlay ? t('Play') : t('Pause')}
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
