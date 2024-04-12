import { registerModel } from '@rocket.chat/models';

import { ReadReceiptsRaw } from './raw/ReadReceipts';

registerModel('IReadReceiptsModel', new ReadReceiptsRaw());
