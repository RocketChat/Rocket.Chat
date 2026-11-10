import { memo } from 'react';

import ComposerAbacLocked from './ComposerAbacLocked';
import ComposerAirGappedRestricted from './ComposerAirGappedRestricted';
import ComposerAnonymous from './ComposerAnonymous';
import ComposerArchived from './ComposerArchived';
import ComposerBlocked from './ComposerBlocked';
import ComposerFederation from './ComposerFederation';
import ComposerJoinWithPassword from './ComposerJoinWithPassword';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';
import ComposerOmnichannel from './ComposerOmnichannel';
import ComposerReadOnly from './ComposerReadOnly';
import ComposerSelectMessages from './ComposerSelectMessages';
import { useComposerActions } from './hooks/useComposerActions';
import { useComposerState } from './hooks/useComposerState';

type ComposerContainerProps = Omit<ComposerMessageProps, 'actions'> & {
	onSend?: () => void;
};

const ComposerContainer = ({ children, onSend, ...props }: ComposerContainerProps) => {
	const state = useComposerState(props.subscription);
	const actions = useComposerActions({ tmid: props.tmid, onSend });

	switch (state.kind) {
		case 'airGappedRestricted':
			return <ComposerAirGappedRestricted />;
		case 'omnichannel':
			return <ComposerOmnichannel {...props} actions={actions} />;
		case 'federation':
			return <ComposerFederation blocked={state.blocked} {...props} actions={actions} />;
		case 'anonymous':
			return <ComposerAnonymous />;
		case 'readOnly':
			return <ComposerReadOnly />;
		case 'archived':
			return <ComposerArchived />;
		case 'abacLocked':
			return <ComposerAbacLocked />;
		case 'joinWithCode':
			return <ComposerJoinWithPassword />;
		case 'blocked':
			return <ComposerBlocked />;
		case 'selectingMessages':
			return <ComposerSelectMessages {...props} />;
		case 'message':
			return (
				<>
					{children}
					<ComposerMessage {...props} actions={actions} />
				</>
			);
	}
};

export default memo(ComposerContainer);
