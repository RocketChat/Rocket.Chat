import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type MessageContentFallbackProps = {
	id?: string;
};

const MessageContentFallback = ({ id }: MessageContentFallbackProps) => {
	const { t } = useTranslation();

	return (
		<Box id={id} fontScale='p2' color='annotation'>
			{t('Message_could_not_be_displayed')}
		</Box>
	);
};

export default MessageContentFallback;
