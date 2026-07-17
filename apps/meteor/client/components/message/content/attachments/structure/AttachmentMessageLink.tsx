import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type AttachmentMessageLinkProps = { href?: string };

const AttachmentAuthorMessageLink = ({ href }: AttachmentMessageLinkProps) => {
	const { t } = useTranslation();

	return <IconButton marginInlineStart={4} mini is='a' href={href} icon='jump' title={t('Jump_to_message')} />;
};

export default AttachmentAuthorMessageLink;
