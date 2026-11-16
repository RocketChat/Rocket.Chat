import { Markup } from '@rocket.chat/gazzodown';
import type { MessageMarkupProps } from '@rocket.chat/ui-message-list';

import GazzodownText from '../../../components/GazzodownText';

/** A message's markdown, with its mentions, channels and search terms resolved. */
const MessageMarkup = ({ md, msg, mentions, channels, searchText }: MessageMarkupProps) => (
	<GazzodownText mentions={mentions} channels={channels} searchText={searchText}>
		<Markup tokens={md} source={msg} />
	</GazzodownText>
);

export default MessageMarkup;
