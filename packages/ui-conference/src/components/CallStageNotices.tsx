import { css } from '@rocket.chat/css-in-js';
import { useStyle } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

/*
 * Kept clear of a phone's notch on whichever side it is, and never taller than the call: what does not fit is
 * clipped rather than drawn over the call's controls. Only what it holds takes clicks, so the call stays usable
 * around it.
 */
const noticesStyles = css`
	--call-stage-notices-inset: max(0.75rem, env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px));

	position: absolute;
	inset-block: 0.75rem;
	inset-inline-end: var(--call-stage-notices-inset);
	z-index: 10;
	width: min(20rem, calc(100% - 2 * var(--call-stage-notices-inset)));
	overflow-y: clip;
	pointer-events: none;
`;

type CallStageNoticesProps = {
	children: ReactNode;
};

/** The corner of the call under the top bar's buttons, where what happens outside the call is shown over it. */
const CallStageNotices = ({ children }: CallStageNoticesProps) => <div className={useStyle(noticesStyles)}>{children}</div>;

export default CallStageNotices;
