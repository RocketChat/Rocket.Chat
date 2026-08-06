import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type CallPanelHeaderProps = {
	title: string;
	/** Anything the panel offers about itself, sitting before the dismissal. */
	children?: ReactNode;
	onClose: () => void;
};

/**
 * The top of a panel docked beside the call — the chat, the members.
 *
 * Dismissal sits at the inline end, where every other closable surface in the product puts it, and the panels
 * share this so two docked side by side don't disagree about where their own edges are.
 */
const CallPanelHeader = ({ title, children, onClose }: CallPanelHeaderProps) => {
	const { t } = useTranslation();

	return (
		<Box
			is='header'
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			paddingInline={12}
			paddingBlock={8}
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
		>
			<Box is='h5' fontScale='h5' color='default'>
				{title}
			</Box>
			<Box display='flex' alignItems='center'>
				{children}
				<IconButton marginInlineStart={children ? 8 : undefined} small icon='cross' title={t('Close')} onClick={onClose} />
			</Box>
		</Box>
	);
};

export default CallPanelHeader;
