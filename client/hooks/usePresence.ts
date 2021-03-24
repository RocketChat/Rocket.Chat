import { useUserData } from './useUserData';

type Presence = 'online' | 'offline' | 'busy' | 'away' | 'loading';


/**
 * Hook to fetch and subscribe users presence
 *
 * @param uid - User Id
 * @returns User Presence - 'online' | 'offline' | 'busy' | 'away' | 'loading'
 * @public
 */

export const usePresence = (uid: string, presence: Presence): Presence => useUserData(uid)?.status || presence;
