import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useCallStageNoticesHost } from '../context/CallStageNoticesContext.js';

export type CallStageNoticesPortalProps = {
	children: ReactNode;
};

/** Draws its children over the call, in the corner under the top bar's buttons. */
const CallStageNoticesPortal = ({ children }: CallStageNoticesPortalProps) => {
	const host = useCallStageNoticesHost();

	return host ? createPortal(children, host) : null;
};

export default CallStageNoticesPortal;
