import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const VoipStatus = ({ isHeld = false, isMuted = false }: { isHeld: boolean; isMuted: boolean }) => {
	const { t } = useTranslation();

	if (!isHeld && !isMuted) {
		return null;
	}

	return (
		<Box fontScale='p2' display='flex' justifyContent='space-between' paddingInline={12} pb={4}>
			{isHeld && (
				<Box is='span' color='default'>
					{t('On_Hold')}
				</Box>
			)}

			{isMuted && (
				<Box is='span' color='status-font-on-warning'>
					{t('Muted')}
				</Box>
			)}
		</Box>
	);
};

export default VoipStatus;
