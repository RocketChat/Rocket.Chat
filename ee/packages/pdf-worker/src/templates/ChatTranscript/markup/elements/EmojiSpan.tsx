import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import joypixels from 'emoji-toolkit';

type EmojiSpanProps = MessageParser.Emoji;

const EmojiSpan = (emoji: EmojiSpanProps) => <Text>{emoji.value ? `:${emoji.value?.value}:` : joypixels.toShort(emoji.unicode)}</Text>;

export default EmojiSpan;
