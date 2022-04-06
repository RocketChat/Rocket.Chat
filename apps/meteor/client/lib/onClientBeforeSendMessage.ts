import type { IMessage } from '@rocket.chat/core-typings';

import { createAsyncTransformChain } from '../../lib/transforms';

export const onClientBeforeSendMessage = createAsyncTransformChain<IMessage>();
