import type { IMessage } from '@rocket.chat/core-typings';
import { MessageStatusIndicatorItem } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ThreadMessagePreviewBody from './ThreadMessagePreviewBody';
import { useMessageContent } from '../../contexts/MessageContentContext';
import { useMessageDisplay } from '../../contexts/MessageDisplayContext';

export type ThreadMessagePreviewOriginProps = {
	/** The message that started the thread. */
	parent: IMessage & { ignored?: boolean };
	/** The reply the preview stands for, which carries the translation state. */
	reply: IMessage;
};

const describeAttachments = (message: IMessage) => {
	const attachment = message.attachments?.find(({ title, description }) => title || description);
	return attachment?.description || attachment?.title || '';
};

/** What the thread started with, shown above the first reply of a run. */
const ThreadMessagePreviewOrigin = ({ parent, reply }: ThreadMessagePreviewOriginProps) => {
	const { t } = useTranslation();
	const { isTranslated } = useMessageDisplay();
	const normalized = useMessageContent().useNormalizedMessage(parent);

	if (parent.ignored) {
		return <>{t('Message_Ignored')}</>;
	}

	const preview = parent.md || parent.msg ? normalized : { ...parent, msg: describeAttachments(parent) };

	return (
		<>
			<ThreadMessagePreviewBody message={preview} />
			{isTranslated(reply) && (
				<>
					{' '}
					<MessageStatusIndicatorItem name='language' color='info' title={t('Translated')} />
				</>
			)}
		</>
	);
};

export default ThreadMessagePreviewOrigin;
