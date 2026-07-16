import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

export type AttachmentTextProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentText = (props: AttachmentTextProps) => {
	const { t } = useTranslation();
	return (
		<Box
			role='document'
			aria-roledescription={t('message_attachment')}
			marginBlockEnd={4}
			marginInline={2}
			fontScale='p2'
			color='default'
			{...props}
		/>
	);
};

export default AttachmentText;
