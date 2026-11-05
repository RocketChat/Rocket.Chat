import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

export type AttachmentAuthorMessageLinkProps = Omit<ComponentPropsWithoutRef<typeof IconButton>, 'icon' | 'is'>;

const AttachmentAuthorMessageLink = ({ href, ...props }: AttachmentAuthorMessageLinkProps) => {
	const { t } = useTranslation();

	return <IconButton size='mini' is='a' href={href} icon='jump' title={t('Jump_to_message')} {...props} />;
};

export default AttachmentAuthorMessageLink;
