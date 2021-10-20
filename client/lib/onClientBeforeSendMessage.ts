import type { IMessage } from '../../definition/IMessage';
import { createAsyncTransformChain } from '../../lib/transforms';

export const onClientBeforeSendMessage = createAsyncTransformChain<IMessage>();
