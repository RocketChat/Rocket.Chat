import type { ILivechatPriority } from '@rocket.chat/core-typings';

import { useOmnichannel } from './useOmnichannel';

export const useOmnichannelPriorities = (): ILivechatPriority => useOmnichannel().livechatPriority;
