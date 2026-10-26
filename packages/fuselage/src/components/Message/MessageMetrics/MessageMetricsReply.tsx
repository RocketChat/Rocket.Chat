import { MessageMetricsItem } from './MessageMetricsItem';
import { Button, type ButtonProps } from '../../Button';

export type MessageMetricsReplyProps = ButtonProps;

const MessageMetricsReply = (props: MessageMetricsReplyProps) => (
	<MessageMetricsItem>
		<Button variant='primary' size='small' {...props} />
	</MessageMetricsItem>
);

export default MessageMetricsReply;
