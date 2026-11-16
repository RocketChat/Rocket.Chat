import type { IMessage } from '@rocket.chat/core-typings';
import { MessageSystemBlock } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { MessageActionLinks, MessageAttachments } from '@rocket.chat/ui-message-list';

type SystemMessageContentProps = {
	message: IMessage;
};

const SystemMessageContent = ({ message }: SystemMessageContentProps) => (
	<>
		{message.attachments && (
			<MessageSystemBlock>
				<MessageAttachments attachments={message.attachments} />
			</MessageSystemBlock>
		)}
		{!!message.actionLinks?.length && (
			<MessageActionLinks
				message={message}
				actions={message.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
					methodId,
					i18nLabel: i18nLabel as TranslationKey,
					...action,
				}))}
			/>
		)}
	</>
);

export default SystemMessageContent;
