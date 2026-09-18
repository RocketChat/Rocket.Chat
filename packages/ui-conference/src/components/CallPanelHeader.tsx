import { ContextualbarActions, ContextualbarClose, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

type CallPanelHeaderProps = {
	title: ReactNode;
	/** What the title *says*, for a title assembled from more than words — an icon otherwise lands mid-name. */
	titleLabel?: string;
	/** Anything the panel offers about itself, sitting before the dismissal. */
	children?: ReactNode;
	onClose: () => void;
};

/** The top of a panel docked beside the call — the product's own contextual-bar header. */
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
