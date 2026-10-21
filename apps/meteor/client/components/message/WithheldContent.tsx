import { Box, Icon, MessageBody } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

type WithheldContentProps = {
	messageId: string;
};

const WithheldContent = ({ messageId }: WithheldContentProps) => {
	const { t } = useTranslation();

	return (
		<MessageBody id={`${messageId}-content`} role='document' aria-roledescription={t('message_body')} dir='auto'>
			<Box display='flex' alignItems='center' fontSize='c2' color='hint'>
				<Icon name='shield' marginInlineEnd='x4' /> {t('Message_withheld_not_cleared')}
			</Box>
		</MessageBody>
	);
};

export default memo(WithheldContent);
