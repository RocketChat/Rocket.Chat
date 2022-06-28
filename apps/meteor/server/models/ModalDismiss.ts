import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { ModalDismissRaw } from './raw/ModalDismiss';

registerModel('IModalDismissModel', new ModalDismissRaw(db, trashCollection));
