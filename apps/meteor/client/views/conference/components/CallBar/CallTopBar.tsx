import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallTopBarProps = {
	/**
	 * Where the call puts its own header — how long it has been running, and whatever it offers about itself.
	 * Given the width it needs, and laid out ends-apart, which is how a call's header reads.
	 */
	host: ReactNode;
	/** This window's own actions about the call, at the inline end. */
	children: ReactNode;
};

/**
 * The conference window's top bar, spanning the whole window above the call *and* its side panels — the mirror
 * of the bottom bar below them.
 *
 * It exists because a call that runs inside Rocket.Chat has a header of its own, and that header is about the
 * call rather than about the slice of the window the call happens to occupy: put inside the call area it stopped
 * at the panel's edge and shifted every time a panel opened. Up here it is fixed, and the panels hang beneath
 * it — which is also where every other conferencing product puts it.
 *
 * Only a provider that renders in here has a header to give: one handed off to an iframe keeps its own chrome
 * inside that frame, so this bar isn't rendered at all for those.
 */
const CallTopBar = ({ host, children }: CallTopBarProps) => (
	<Box
		is='header'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		flexShrink={0}
		width='100%'
		minHeight={48}
		paddingInline={12}
		style={{ gap: 8 }}
	>
		{host}
		<ButtonGroup style={{ gap: 8 }}>{children}</ButtonGroup>
	</Box>
);

export default CallTopBar;
