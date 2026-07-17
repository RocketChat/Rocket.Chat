import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

// Curated layout surface: consumers use these to center the top-level section
// (maxWidth + marginInline) or to emphasize it (fontScale). Prefer variants over
// widening this set.
export type InfoPanelSectionProps = {
	children?: ReactNode;
} & Pick<ComponentProps<typeof Box>, 'maxWidth' | 'marginInline' | 'fontScale'>;

const InfoPanelSection = ({ children, ...props }: InfoPanelSectionProps) => (
	<Box marginBlock={24} {...props}>
		{children}
	</Box>
);

export default InfoPanelSection;
