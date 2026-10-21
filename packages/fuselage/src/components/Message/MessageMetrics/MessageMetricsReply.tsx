import { MessageMetricsItem } from './MessageMetricsItem';
import { Button, type ButtonProps } from '../../Button';

export type MessageMetricsReplyProps = ButtonProps;

const MessageMetricsReply = (props: MessageMetricsReplyProps) => (
	<MessageMetricsItem>
		<Button primary {...props} small />
	</MessageMetricsItem>
);

export default MessageMetricsReply;
