import type { IUser } from '@rocket.chat/core-typings';

import { shouldPreventAction } from './validation/shouldPreventAction';

export const preventNewUsers = async (userCount = 1) => shouldPreventAction('activeUsers', {}, userCount);
export const preventNewGuests = async (guestCount = 1) => shouldPreventAction('guestUsers', {}, guestCount);
export const preventNewPrivateApps = async (appCount = 1) => shouldPreventAction('privateApps', {}, appCount);
export const preventNewMarketplaceApps = async (appCount = 1) => shouldPreventAction('marketplaceApps', {}, appCount);
export const preventNewGuestSubscriptions = async (guest: IUser['_id'], roomCount = 1) =>
	shouldPreventAction('roomsPerGuest', { userId: guest }, roomCount);
export const preventNewActiveContacts = async (contactCount = 1) => shouldPreventAction('monthlyActiveContacts', {}, contactCount);

export const userLimitReached = async () => preventNewUsers(0);
export const guestLimitReached = async () => preventNewGuests(0);
export const privateAppLimitReached = async () => preventNewPrivateApps(0);
export const marketplaceAppLimitReached = async () => preventNewMarketplaceApps(0);
export const guestSubscriptionLimitReached = async (guest: IUser['_id']) => preventNewGuestSubscriptions(guest, 0);
export const macLimitReached = async () => preventNewActiveContacts(0);
