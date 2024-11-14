import { db } from './utils';
import { TrashRaw } from '../models/raw/Trash';

const Trash = new TrashRaw(db);
export const trashCollection = Trash.col;
