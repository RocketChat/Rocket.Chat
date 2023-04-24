import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { MigrationsRaw } from './raw/Migrations';

registerModel('IMigrationsModel', new MigrationsRaw(db));
