import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';

export const useRequestSeatsLink = (): string => useAbsoluteUrl()('/requestSeats');
