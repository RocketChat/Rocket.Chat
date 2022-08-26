import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { MatrixBridgedRoomRaw } from './raw/MatrixBridgedRoom';

registerModel('IMatrixBridgedRoomModel', new MatrixBridgedRoomRaw(db));
