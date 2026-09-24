import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../../hooks/useClipboardWithToast';

export type ContactInfoEntryProps = {
	text: string;
	actionIcon: ComponentProps<typeof IconButton>['icon'];
	actionLabel: string;
	onAction?: () => void;
};

/**
 * One address or number with the actions it affords. The buttons stay mounted and only fade, so they keep
 * their place in the tab order and a keyboard reaching them brings them back into view.
 */
const ContactInfoEntry = ({ text, actionIcon, actionLabel, onAction }: ContactInfoEntryProps) => {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);
	const { copy } = useClipboardWithToast(text);

	return (
		<Box
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			onMouseEnter={() => setRevealed(true)}
			onMouseLeave={() => setRevealed(false)}
			onFocus={() => setRevealed(true)}
			onBlur={() => setRevealed(false)}
		>
			<Box fontScale='p2' color='default' withTruncatedText>
				{text}
			</Box>
			<Box display='flex' flexShrink={0} style={{ opacity: revealed ? 1 : 0 }}>
				<IconButton tiny icon={actionIcon} title={actionLabel} aria-label={actionLabel} disabled={!onAction} onClick={onAction} />
				<IconButton tiny icon='copy' title={t('Copy')} aria-label={t('Copy')} onClick={() => copy()} />
			</Box>
		</Box>
	);
};

export default ContactInfoEntry;
