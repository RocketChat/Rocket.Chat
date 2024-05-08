import { registerModel } from '@rocket.chat/models';

import { MatrixBridgedRoomRaw } from './raw/MatrixBridgedRoom';

registerModel('IMatrixBridgedRoomModel', new MatrixBridgedRoomRaw());
