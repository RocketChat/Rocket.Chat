import type * as MessageParser from '@rocket.chat/message-parser';

import Emoji from './Emoji';

type BigEmojiElementProps = MessageParser.Emoji;

const BigEmojiElement = (emoji: BigEmojiElementProps) => <Emoji big {...emoji} />;

export default BigEmojiElement;
