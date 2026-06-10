import type { Palette } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type MessageNotificationProps = {
	label: TranslationKey;
	bg: keyof (typeof Palette)['badge'];
};

const MessageNotification = ({ label, bg }: MessageNotificationProps) => {
	const { t } = useTranslation();
	return <Box width='x8' aria-label={t(label)} borderRadius='full' height='x8' bg={bg} />;
};

export default MessageNotification;
