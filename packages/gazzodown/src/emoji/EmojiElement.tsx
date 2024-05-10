import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, memo } from 'react';

import Emoji from './Emoji';

type EmojiElementProps = MessageParser.Emoji;

const EmojiElement = (emoji: EmojiElementProps): ReactElement => <Emoji {...emoji} />;

export default memo(EmojiElement);
