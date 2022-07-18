import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { MatrixBridgedUserRaw } from './raw/MatrixBridgedUser';

registerModel('IMatrixBridgedUserModel', new MatrixBridgedUserRaw(db, trashCollection));
