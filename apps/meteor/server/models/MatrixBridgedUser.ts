import { registerModel } from '@rocket.chat/models';

import { MatrixBridgedUserRaw } from './raw/MatrixBridgedUser';

registerModel('IMatrixBridgedUserModel', new MatrixBridgedUserRaw());
