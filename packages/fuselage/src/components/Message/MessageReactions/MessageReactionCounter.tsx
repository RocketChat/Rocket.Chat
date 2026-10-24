import { styled, Text } from '@tamagui/web';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv, textScale } from '../messageStyles';

const MessageReactionCounterFrame = styled(Text, {
	...plainDiv,
	...textScale('c1'),
	marginInline: spacing('x2'),
});

export type MessageReactionCounterProps = {
	counter: number;
	className?: string;
};

const MessageReactionCounter = ({ counter, className }: MessageReactionCounterProps) => (
	<MessageReactionCounterFrame className={['rcx-message-reactions__counter', className].filter(Boolean).join(' ')}>
		{counter}
	</MessageReactionCounterFrame>
);

export default withFuselageProvider(MessageReactionCounter);
