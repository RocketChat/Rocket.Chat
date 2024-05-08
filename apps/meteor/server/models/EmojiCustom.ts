import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { EmojiCustomRaw } from './raw/EmojiCustom';

registerModel('IEmojiCustomModel', new EmojiCustomRaw(trashCollection));
