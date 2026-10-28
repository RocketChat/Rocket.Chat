import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HoverCardSectionProps = {
	/** A secondary section below the first one: tinted and separated by a top border. */
	tinted?: boolean;
	children: ReactNode;
};

const HoverCardSection = ({ tinted = false, children }: HoverCardSectionProps) => (
	<Box
		display='flex'
		flexDirection='column'
		paddingBlock='x16'
		paddingInline='x16'
		{...(tinted && { backgroundColor: 'tint', borderBlockStartWidth: 'default', borderBlockStartColor: 'stroke-extra-light' })}
	>
		{children}
	</Box>
);

export default HoverCardSection;
