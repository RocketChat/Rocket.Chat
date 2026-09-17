import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import { unicodeToShortname } from '../emoji';

export type EmojiSpanProps = MessageParser.Emoji;

const EmojiSpan = (emoji: EmojiSpanProps) => <Text>{emoji.value ? `:${emoji.value?.value}:` : unicodeToShortname(emoji.unicode)}</Text>;

export default EmojiSpan;
