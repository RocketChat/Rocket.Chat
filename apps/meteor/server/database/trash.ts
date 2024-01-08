import { TrashRaw } from '../models/raw/Trash';
import { db } from './utils';

const Trash = new TrashRaw(db);
export const trashCollection = Trash.col;
