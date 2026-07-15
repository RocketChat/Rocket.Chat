import type { Box } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

type AttachmentAuthorMessageLinkProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorMessageLink = ({ href, ...props }: AttachmentAuthorMessageLinkProps) => {
	const { t } = useTranslation();

	return <IconButton mis={4} mini is='a' href={href} icon='jump' title={t('Jump_to_message')} {...props} />;
};

export default AttachmentAuthorMessageLink;
