import type { Box } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

type AttachmentAuthorMessageLinkProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorMessageLink = ({ href, ...props }: AttachmentAuthorMessageLinkProps) => {
	const { t } = useTranslation();

	return <IconButton mis={4} mini is='a' color='info' href={href} icon='new-window' title={t('Jump_to_message')} {...props} />;
};

export default AttachmentAuthorMessageLink;
