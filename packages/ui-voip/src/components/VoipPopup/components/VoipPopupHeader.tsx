import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import VoipSettingsButton from '../../VoipSettingsButton';

type VoipPopupHeaderProps = {
	children?: ReactNode;
	hideSettings?: boolean;
	onClose?: () => void;
};

const VoipPopupHeader = ({ children, hideSettings, onClose }: VoipPopupHeaderProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box is='header' p={12} pbe={4} display='flex' alignItems='center' justifyContent='space-between'>
			{children && (
				<Box is='h3' id='voipPopupTitle' color='titles-labels' fontScale='p2' fontWeight='700'>
					{children}
				</Box>
			)}

			{!hideSettings && (
				<Box mis={8}>
					<VoipSettingsButton mini />
				</Box>
			)}

			{onClose && <IconButton mini mis={8} aria-label={t('Close')} icon='cross' onClick={onClose} />}
		</Box>
	);
};
export default VoipPopupHeader;
