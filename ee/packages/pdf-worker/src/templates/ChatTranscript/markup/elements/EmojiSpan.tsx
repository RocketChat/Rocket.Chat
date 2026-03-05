import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

type EmojiSpanProps = MessageParser.Emoji;

const EmojiSpan = (emoji: EmojiSpanProps) => <Text>{emoji.value ? `:${emoji.value?.value}:` : emoji.unicode}</Text>;

export default EmojiSpan;
