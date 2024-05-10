import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { MatrixBridgedUserRaw } from './raw/MatrixBridgedUser';

registerModel('IMatrixBridgedUserModel', new MatrixBridgedUserRaw(db));
