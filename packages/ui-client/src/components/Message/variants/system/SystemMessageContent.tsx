import type { IMessage } from '@rocket.chat/core-typings';
import { MessageSystemBlock } from '@rocket.chat/fuselage';

import Attachments from '../../content/Attachments';
import MessageActions from '../../content/MessageActions';
import { toMessageActionOptions } from '../../lib/toMessageActionOptions';

export type SystemMessageContentProps = {
	message: IMessage;
};

const SystemMessageContent = ({ message }: SystemMessageContentProps) => (
	<>
		{message.attachments && (
			<MessageSystemBlock>
				<Attachments attachments={message.attachments} />
			</MessageSystemBlock>
		)}
		{!!message.actionLinks?.length && <MessageActions message={message} actions={toMessageActionOptions(message.actionLinks)} />}
	</>
);

export default SystemMessageContent;
