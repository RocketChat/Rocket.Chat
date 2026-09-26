import { memo } from 'react';

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
import { useComposerState } from './hooks/useComposerState';

const ComposerContainer = ({ children, ...props }: ComposerMessageProps) => {
	const state = useComposerState(props.subscription);

	switch (state.kind) {
		case 'airGappedRestricted':
			return <ComposerAirGappedRestricted />;
		case 'omnichannel':
			return <ComposerOmnichannel {...props} />;
		case 'federation':
			return <ComposerFederation blocked={state.blocked} {...props} />;
		case 'anonymous':
			return <ComposerAnonymous />;
		case 'readOnly':
			return <ComposerReadOnly />;
		case 'archived':
			return <ComposerArchived />;
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
					<ComposerMessage {...props} />
				</>
			);
	}
};

export default memo(ComposerContainer);
