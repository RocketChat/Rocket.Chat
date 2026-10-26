import { styled, Text } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type StatesSuggestionListItemProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLLIElement>;

const StatesSuggestionListItemWrapper = styled(Text, {
	render: 'span',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	boxSizing: 'content-box',
	marginInlineStart: spacing('neg-x4'),
});

const StatesSuggestionListItem = ({ children, className, ...props }: StatesSuggestionListItemProps) => (
	<li {...props} className={prependClassName(className, 'rcx-states__list-item')}>
		<StatesSuggestionListItemWrapper className='rcx-states__list-item-wrapper'>{children}</StatesSuggestionListItemWrapper>
	</li>
);

export default withFuselageProvider(StatesSuggestionListItem);
