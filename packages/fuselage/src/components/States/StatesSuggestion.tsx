import type { GetProps } from '@tamagui/web';
import type { ReactNode, AllHTMLAttributes } from 'react';

import { StatesBlockFrame } from './StatesSubtitle';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type StatesSuggestionProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesSuggestion = ({ children, ...props }: StatesSuggestionProps) => (
	<StatesBlockFrame {...(props as GetProps<typeof StatesBlockFrame>)} className='rcx-states__suggestion'>
		{children}
	</StatesBlockFrame>
);

export default withFuselageProvider(StatesSuggestion);
