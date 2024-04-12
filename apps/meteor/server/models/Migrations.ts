import { registerModel } from '@rocket.chat/models';

import { MigrationsRaw } from './raw/Migrations';

registerModel('IMigrationsModel', new MigrationsRaw());
