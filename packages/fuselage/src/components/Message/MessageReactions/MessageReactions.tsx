import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import MessageBlock from '../MessageBlock';
import { plainDiv } from '../messageStyles';

const MessageReactionsContainer = styled(Text, {
	...plainDiv,
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	justifyContent: 'flex-start',
	margin: spacing('neg-x2'),
});

export type MessageReactionsProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageReactions(props: MessageReactionsProps) {
	return (
		<MessageBlock className='rcx-message-reactions'>
			<MessageReactionsContainer className='rcx-message-reactions__container' {...(props as GetProps<typeof MessageReactionsContainer>)} />
		</MessageBlock>
	);
}

export default withFuselageProvider(MessageReactions);
