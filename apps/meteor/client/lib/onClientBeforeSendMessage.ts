import type { AtLeast, IMessage } from '@rocket.chat/core-typings';

import { createAsyncTransformChain } from '../../lib/transforms';

export const onClientBeforeSendMessage = createAsyncTransformChain<AtLeast<IMessage, '_id' | 'rid' | 'msg'>>();
