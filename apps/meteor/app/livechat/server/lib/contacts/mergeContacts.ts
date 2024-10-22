import type { ILivechatContact } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const mergeContacts = makeFunction(async (_contactId: string, _visitorId: string): Promise<ILivechatContact | null> => null);
