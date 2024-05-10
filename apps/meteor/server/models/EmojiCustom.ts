import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { EmojiCustomRaw } from './raw/EmojiCustom';

registerModel('IEmojiCustomModel', new EmojiCustomRaw(db, trashCollection));
