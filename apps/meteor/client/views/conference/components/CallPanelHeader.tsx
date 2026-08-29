import { ContextualbarActions, ContextualbarClose, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

type CallPanelHeaderProps = {
	title: ReactNode;
	/** Anything the panel offers about itself, sitting before the dismissal. */
	children?: ReactNode;
	onClose: () => void;
};

/**
 * The top of a panel docked beside the call — the chat, the members.
 *
 * The product's own contextual-bar header, so these panels agree with every other closable surface about where
 * a title sits and where dismissal is, and the panels share this so two docked side by side don't disagree
 * about their own edges.
 */
const CallPanelHeader = ({ title, children, onClose }: CallPanelHeaderProps) => (
	<ContextualbarHeader>
		<ContextualbarTitle>{title}</ContextualbarTitle>
		<ContextualbarActions>
			{children}
			<ContextualbarClose onClick={onClose} />
		</ContextualbarActions>
	</ContextualbarHeader>
);

export default CallPanelHeader;
