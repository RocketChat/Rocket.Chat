import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const SidepanelSectionFrame = styled(View, {
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexDirection: 'row',
	flexShrink: 1,
	justifyContent: 'space-between',
	alignItems: 'center',
	gap: spacing('x8'),
	padding: spacing('x16'),
});

export type SidepanelSectionProps = HTMLAttributes<HTMLDivElement>;

const SidepanelSection = ({ className, ...props }: SidepanelSectionProps) => (
	<SidepanelSectionFrame
		className={['rcx-sidepanel-section', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof SidepanelSectionFrame>)}
	/>
);

export default withFuselageProvider(SidepanelSection);
