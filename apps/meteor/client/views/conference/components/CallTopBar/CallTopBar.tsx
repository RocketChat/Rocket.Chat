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
 * The conference window's top bar, spanning the whole window above the call and its side panels.
 *
 * It sits up here rather than inside the call area because what it says is about the call, not about the slice
 * of the window the call happens to occupy: put in the call area it stopped at the panel's edge and shifted
 * every time a panel opened. Fixed above them, the panels hang beneath it.
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
