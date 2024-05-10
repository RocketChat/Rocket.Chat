import type { Inquiries } from '@rocket.chat/core-typings';

import { useOmnichannel } from './useOmnichannel';

export const useQueuedInquiries = (): Inquiries => useOmnichannel().inquiries;
