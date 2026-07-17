import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type AttachmentTextProps = { children?: ReactNode };

const AttachmentText = ({ children }: AttachmentTextProps) => {
	const { t } = useTranslation();
	return (
		<Box
			role='document'
			aria-roledescription={t('message_attachment')}
			marginBlockEnd={4}
			marginInline={2}
			fontScale='p2'
			color='default'
		>
			{children}
		</Box>
	);
};

export default AttachmentText;
