import { Badge, Box, Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

export type ActionToggleChatProps = {
	pressed: boolean;
	onClick: () => void;
	badgeCount?: number;
	badgeVariant?: ComponentProps<typeof Badge>['variant'];
};
const ActionToggleChat = ({ pressed, onClick, badgeCount = 0, badgeVariant = 'secondary' }: ActionToggleChatProps) => {
	const { t } = useTranslation();
	const icon = pressed ? 'chevron-down' : 'chevron-up';

	const label = pressed ? t('Hide_chat') : t('Show_chat');
	// The badge is decorative to assistive tech: the count travels in the button's own name instead, so it is
	// announced once, with the control it belongs to, rather than as a stray number beside it.
	return (
		<Box position='relative' display='inline-flex'>
			<Button medium onClick={onClick} icon={icon} aria-label={badgeCount > 0 ? `${label}, ${badgeCount} ${t('Unread')}` : undefined}>
				{label}
			</Button>
			{badgeCount > 0 && (
				<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4} pointerEvents='none' aria-hidden>
					<Badge variant={badgeVariant}>{badgeCount}</Badge>
				</Box>
			)}
		</Box>
	);
};

export default ActionToggleChat;
