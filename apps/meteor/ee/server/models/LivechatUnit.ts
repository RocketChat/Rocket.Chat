import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatUnitRaw } from './raw/LivechatUnit';

// @ts-expect-error - Overriding base types :)
registerModel('ILivechatUnitModel', new LivechatUnitRaw(db));
