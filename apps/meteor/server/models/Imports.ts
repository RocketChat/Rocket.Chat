import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ImportsModel } from './raw/Imports';

registerModel('IImportsModel', new ImportsModel(db));
