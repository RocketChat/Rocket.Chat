import { styled } from '@tamagui/web';
import type { ReactNode, AllHTMLAttributes } from 'react';

import { StatesBlockFrame } from './StatesSubtitle';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type StatesSuggestionProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesSuggestion = styled(StatesBlockFrame, {
	variants: {
		rcx: { true: variantClass('rcx-states__suggestion') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<StatesSuggestionProps>(StatesSuggestion);
