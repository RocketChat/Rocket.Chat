import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { stopShareButtonStyles } from './stageStyles';

export type StopShareButtonProps = {
	onStop: () => void;
};

/** Stops the reader's own screen share, from the corner of the screen they are sharing. */
const StopShareButton = ({ onStop }: StopShareButtonProps) => {
	const { t } = useTranslation();

	return (
		<Box className={stopShareButtonStyles}>
			<IconButton icon='cross' small secondary onClick={onStop} title={t('Stop_sharing')} />
		</Box>
	);
};

export default StopShareButton;
