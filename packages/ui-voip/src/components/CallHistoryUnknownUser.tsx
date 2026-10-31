import { Box, FramedIcon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const CallHistoryUnknownUser = () => {
	const { t } = useTranslation();
	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Box marginInlineEnd={8}>
				<FramedIcon icon='warning' />
			</Box>
			<Box>{t('Unknown')}</Box>
		</Box>
	);
};

export default CallHistoryUnknownUser;
