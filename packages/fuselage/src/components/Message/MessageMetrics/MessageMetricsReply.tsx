import { MessageMetricsItem } from './MessageMetricsItem/index.js';
import { Button, type ButtonProps } from '../../Button/index.js';

export type MessageMetricsReplyProps = ButtonProps;

const MessageMetricsReply = (props: MessageMetricsReplyProps) => (
	<MessageMetricsItem>
		<Button variant='primary' size='small' {...props} />
	</MessageMetricsItem>
);

export default MessageMetricsReply;
