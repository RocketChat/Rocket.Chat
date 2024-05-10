import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import emojione from 'emoji-toolkit';

type EmojiSpanProps = MessageParser.Emoji;

const EmojiSpan = (emoji: EmojiSpanProps) => <Text>{emoji.value ? `:${emoji.value?.value}:` : emojione.toShort(emoji.unicode)}</Text>;

export default EmojiSpan;
