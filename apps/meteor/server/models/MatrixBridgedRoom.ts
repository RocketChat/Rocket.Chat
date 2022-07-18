import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { MatrixBridgedRoomRaw } from './raw/MatrixBridgedRoom';

registerModel('IMatrixBridgedRoomModel', new MatrixBridgedRoomRaw(db, trashCollection));
