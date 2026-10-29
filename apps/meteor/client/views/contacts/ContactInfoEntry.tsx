import { ButtonGroup, IconButton, Stack, Text } from '@rocket.chat/fuselage';
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
	const { copy, hasCopied } = useClipboardWithToast(text);

	return (
		<Stack direction='row' align='center' justify='space-between'>
			<Text fontScale='p2' color='default' truncate>
				{text}
			</Text>
			<ButtonGroup small>
				<IconButton size='tiny' icon={actionIcon} title={actionLabel} aria-label={actionLabel} disabled={!onAction} onClick={onAction} />
				<IconButton size='tiny' icon='copy' title={t('Copy')} aria-label={t('Copy')} disabled={hasCopied} onClick={() => copy()} />
			</ButtonGroup>
		</Stack>
	);
};

export default ContactInfoEntry;
