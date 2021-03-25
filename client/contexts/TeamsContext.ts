import { createContext, useContext } from 'react';

import { IRoom } from '../../definition/IRoom';

type TeamsContextValue = {
	fetch: (teamId: string) => void;
	rooms: IRoom[];
	count: number;
};

export const TeamsContext = createContext<TeamsContextValue>({
	fetch: () => undefined,
	rooms: [],
	count: 0,
});

export const useTeamsChannels = (): TeamsContextValue => useContext(TeamsContext);
