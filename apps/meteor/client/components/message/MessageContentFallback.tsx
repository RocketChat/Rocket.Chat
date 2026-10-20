import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const MessageContentFallback = () => {
	const { t } = useTranslation();

	return (
		<Box fontScale='p2' color='annotation'>
			{t('Message_could_not_be_displayed')}
		</Box>
	);
};

export default MessageContentFallback;
