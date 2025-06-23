import type { Inquiries } from '@rocket.chat/core-typings';
import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useQueuedInquiries = (): Inquiries => useOmnichannel().inquiries;
