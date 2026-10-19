import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { StatesBlockFrame } from './StatesSubtitle';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type StatesSuggestionListProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLUListElement>;

const StatesSuggestionListFrame = styled(StatesBlockFrame, {
	render: 'ul',
	marginBlockEnd: 0,
	listStyle: 'initial',
});

const StatesSuggestionList = ({ children, ...props }: StatesSuggestionListProps) => (
	<StatesSuggestionListFrame {...(props as GetProps<typeof StatesSuggestionListFrame>)} className='rcx-states__list'>
		{children}
	</StatesSuggestionListFrame>
);

export default withFuselageProvider(StatesSuggestionList);
