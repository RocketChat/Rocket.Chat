import type * as MessageParser from '@rocket.chat/message-parser';

import Emoji from './Emoji';

type PreviewEmojiElementProps = MessageParser.Emoji;

const PreviewEmojiElement = (emoji: PreviewEmojiElementProps) => <Emoji preview {...emoji} />;

export default PreviewEmojiElement;
