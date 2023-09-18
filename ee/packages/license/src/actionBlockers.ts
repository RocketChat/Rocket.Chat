import type { IUser } from '@rocket.chat/core-typings';

import { shouldPreventAction } from './validation/shouldPreventAction';

export const preventNewUsers = async (userCount = 1) => shouldPreventAction('activeUsers', {}, userCount);
export const preventNewGuests = async (guestCount = 1) => shouldPreventAction('guestUsers', {}, guestCount);
export const preventNewPrivateApps = async (appCount = 1) => shouldPreventAction('privateApps', {}, appCount);
export const preventNewMarketplaceApps = async (appCount = 1) => shouldPreventAction('marketplaceApps', {}, appCount);
export const preventNewGuestSubscriptions = async (guest: IUser['_id'], roomCount = 1) =>
	shouldPreventAction('roomsPerGuest', { userId: guest }, roomCount);
