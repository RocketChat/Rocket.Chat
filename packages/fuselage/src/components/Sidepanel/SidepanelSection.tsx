import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { spacing } from '../../styleTokens';

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

const SidepanelSection = styled(SidepanelSectionFrame, {
	variants: {
		rcx: { true: variantClass('rcx-sidepanel-section') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<SidepanelSectionProps>(SidepanelSection);
