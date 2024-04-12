import { registerModel } from '@rocket.chat/models';

import { LivechatUnitRaw } from './raw/LivechatUnit';

// @ts-expect-error - Overriding base types :)
registerModel('ILivechatUnitModel', new LivechatUnitRaw());
