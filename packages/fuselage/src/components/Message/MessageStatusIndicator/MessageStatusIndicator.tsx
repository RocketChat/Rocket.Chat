import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

const MessageStatusIndicatorFrame = styled(Text, {
	...plainDiv,
	marginBlock: spacing('x2'),
	userSelect: 'none',
});

export type MessageStatusIndicatorProps = AllHTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageStatusIndicator(props: MessageStatusIndicatorProps) {
	return (
		<MessageStatusIndicatorFrame className='rcx-message-status-indicator' {...(props as GetProps<typeof MessageStatusIndicatorFrame>)} />
	);
}

export default withFuselageProvider(MessageStatusIndicator);
