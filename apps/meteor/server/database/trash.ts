import { registerModel, TrashRaw } from '@rocket.chat/models';

import { db } from './utils';

const Trash = new TrashRaw(db);
export const trashCollection = Trash.col;

registerModel('ITrashModel', Trash);
