import { createContext, useContext } from 'react';

import { ILivechatVisitorInfo } from '../../../../definition/ILivechatVisitorInfo';
import { IOmnichannelRoom } from '../../../../definition/IRoom';

export type OmnichannelRoomContextValue = {
	rid: IOmnichannelRoom['_id'] | undefined;
	visitorId: IOmnichannelRoom['v']['_id'] | undefined;
	visitorInfo: ILivechatVisitorInfo | undefined;
};

export const OmnichannelRoomContext = createContext<OmnichannelRoomContextValue | null>(null);

export const useOmnichannelVisitorInfo = (): OmnichannelRoomContextValue['visitorInfo'] => {
	const { visitorInfo } = useContext(OmnichannelRoomContext);
	return visitorInfo;
};
