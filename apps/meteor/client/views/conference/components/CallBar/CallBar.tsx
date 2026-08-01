import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallBarProps = {
	children: ReactNode;
};

/**
 * The in-call control bar, pinned along the bottom of a conference — the same position third-party
 * providers put their own toolbar in, so an embedded provider and the native conference read the same.
 *
 * It is `relative` so a `placement='end'` group can sit at the inline end without pulling the centred
 * controls off-centre.
 */
const CallBar = ({ children }: CallBarProps) => (
	<Box
		is='footer'
		display='flex'
		alignItems='center'
		justifyContent='center'
		position='relative'
		flexShrink={0}
		width='100%'
		minHeight={56}
		paddingInline={12}
		backgroundColor='surface-light'
		borderBlockStartWidth='default'
		borderBlockStartStyle='solid'
		borderBlockStartColor='stroke-extra-light'
	>
		{children}
	</Box>
);

export default CallBar;
