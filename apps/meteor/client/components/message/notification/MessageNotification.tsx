import type { Palette } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export type MessageNotificationProps = {
	label: TranslationKey;
	backgroundColor: keyof (typeof Palette)['badge'];
};

const MessageNotification = ({ label, backgroundColor }: MessageNotificationProps) => {
	const { t } = useTranslation();
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' backgroundColor={backgroundColor} />;
};

export default MessageNotification;
