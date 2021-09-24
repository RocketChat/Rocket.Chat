import { useAbsoluteUrl } from '../../../../../client/contexts/ServerContext';

export const useRequestSeatsLink = (): string => useAbsoluteUrl()('/requestSeats');
