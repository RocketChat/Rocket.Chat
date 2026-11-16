import { PreviewMarkup } from '@rocket.chat/gazzodown';
import type { MessagePreviewMarkupProps } from '@rocket.chat/ui-message-list';

import GazzodownText from '../../../components/GazzodownText';

/** The first lines of a message's markdown, inline, as a preview shows them. */
const MessagePreviewMarkup = ({ message }: MessagePreviewMarkupProps) =>
	message.md ? (
		<GazzodownText>
			<PreviewMarkup tokens={message.md} />
		</GazzodownText>
	) : (
		<>{message.msg}</>
	);

export default MessagePreviewMarkup;
