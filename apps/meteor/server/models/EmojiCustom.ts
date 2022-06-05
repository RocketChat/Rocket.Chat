import { registerModel } from '@rocket.chat/models';
import type { IEmojiCustomModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { EmojiCustomRaw } from './raw/EmojiCustom';

const col = db.collection(`${prefix}custom_emoji`);
registerModel('IEmojiCustomModel', new EmojiCustomRaw(col, trashCollection) as IEmojiCustomModel);
