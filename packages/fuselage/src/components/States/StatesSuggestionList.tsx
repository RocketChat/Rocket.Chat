import { styled } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { StatesBlockFrame } from './StatesSubtitle';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type StatesSuggestionListProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLUListElement>;

const StatesSuggestionListFrame = styled(StatesBlockFrame, {
	render: 'ul',
	marginBlockEnd: 0,
	listStyle: 'initial',

	variants: {
		rcx: { true: variantClass('rcx-states__list') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<StatesSuggestionListProps>(StatesSuggestionListFrame);
