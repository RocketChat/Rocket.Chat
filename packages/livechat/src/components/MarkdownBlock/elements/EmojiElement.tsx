import type * as MessageParser from '@rocket.chat/message-parser';

import Emoji from './Emoji';

export type EmojiElementProps = MessageParser.Emoji;

const EmojiElement = (emoji: EmojiElementProps) => <Emoji {...emoji} />;

export default EmojiElement;
