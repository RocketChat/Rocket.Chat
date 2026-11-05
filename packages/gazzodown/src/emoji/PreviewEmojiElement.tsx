import type * as MessageParser from '@rocket.chat/message-parser';

import Emoji from './Emoji.js';

export type PreviewEmojiElementProps = MessageParser.Emoji;

const PreviewEmojiElement = (emoji: PreviewEmojiElementProps) => <Emoji preview {...emoji} />;

export default PreviewEmojiElement;
