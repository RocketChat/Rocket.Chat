import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import zIndex from '@rocket.chat/fuselage-tokens/dist/zIndex.json' with { type: 'json' };
import type { Ref } from 'react';

/*
 * Kept clear of a phone's notch on whichever side it is. Only what it holds takes clicks, so the call stays
 * usable around it.
 */
const hostStyles = css`
	inset-inline-end: max(0.75rem, env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px));
	width: min(20rem, calc(100% - 2 * max(0.75rem, env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))));
	pointer-events: none;

	& > * {
		pointer-events: auto;
	}
`;

export type CallStageNoticesHostProps = {
	ref: Ref<HTMLDivElement>;
};

/** Where `CallStageNoticesPortal` draws over the call. What does not fit is clipped rather than drawn over the call's controls. */
const CallStageNoticesHost = ({ ref }: CallStageNoticesHostProps) => (
	<Box ref={ref} className={hostStyles} position='absolute' insetBlock={0} paddingBlock='x12' zIndex={zIndex.sticky} overflowY='clip' />
);

export default CallStageNoticesHost;
