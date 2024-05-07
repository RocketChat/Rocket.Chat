import { registerModel } from '@rocket.chat/models';

import { ReadReceiptsDummy } from './dummy/ReadReceipts';

registerModel('IReadReceiptsModel', new ReadReceiptsDummy(), false);
