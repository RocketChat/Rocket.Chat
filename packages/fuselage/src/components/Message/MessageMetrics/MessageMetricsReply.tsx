import { MessageMetricsItem } from './MessageMetricsItem';
import { Button, type ButtonProps } from '../../Button';

export type MessageMetricsReplyProps = ButtonProps;

const MessageMetricsReply = (props: MessageMetricsReplyProps) => (
	<MessageMetricsItem>
		<Button primary small {...props} />
	</MessageMetricsItem>
);

export default MessageMetricsReply;
