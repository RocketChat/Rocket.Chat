import { ContextualbarActions, ContextualbarClose, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

type CallPanelHeaderProps = {
	title: ReactNode;
	/**
	 * What the title *says*, for a title assembled from more than words — an icon between them lands in the
	 * middle of the name otherwise. It goes on the heading, which is the element a name can be put on: a
	 * `generic` element like a `span` cannot be named at all, so labelling the contents achieves nothing.
	 */
	titleLabel?: string;
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
const CallPanelHeader = ({ title, titleLabel, children, onClose }: CallPanelHeaderProps) => (
	<ContextualbarHeader>
		<ContextualbarTitle aria-label={titleLabel}>{title}</ContextualbarTitle>
		<ContextualbarActions>
			{children}
			<ContextualbarClose onClick={onClose} />
		</ContextualbarActions>
	</ContextualbarHeader>
);

export default CallPanelHeader;
