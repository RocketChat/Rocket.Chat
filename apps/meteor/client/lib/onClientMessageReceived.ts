import type { IMessage } from '@rocket.chat/core-typings';

import { createAsyncTransformChain } from './transforms';

export const onClientMessageReceived = createAsyncTransformChain<IMessage>();
