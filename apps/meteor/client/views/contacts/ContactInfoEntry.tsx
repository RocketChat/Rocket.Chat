import { Box, IconButton } from '@rocket.chat/fuselage';
import { useClipboardWithToast } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

export type ContactInfoEntryProps = {
	text: string;
	actionIcon: ComponentProps<typeof IconButton>['icon'];
	actionLabel: string;
	onAction?: () => void;
};

const ContactInfoEntry = ({ text, actionIcon, actionLabel, onAction }: ContactInfoEntryProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(text);

	return (
		<Box display='flex' alignItems='center' justifyContent='space-between'>
			<Box fontScale='p2' color='default' withTruncatedText>
				{text}
			</Box>
			<Box display='flex' flexShrink={0}>
				<IconButton tiny icon={actionIcon} title={actionLabel} aria-label={actionLabel} disabled={!onAction} onClick={onAction} />
				<IconButton tiny icon='copy' title={t('Copy')} aria-label={t('Copy')} onClick={() => copy()} />
			</Box>
		</Box>
	);
};

export default ContactInfoEntry;
