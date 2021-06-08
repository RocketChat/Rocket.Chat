import { createContext, useContext } from 'react';

import { IOmnichannelRoom } from '../../../../definition/IRoom';
import { ILivechatVisitorInfo } from '../../../../definition/ILivechatVisitorInfo';

export type OmnichannelRoomContextValue = {
	rid: IOmnichannelRoom['_id'];
	visitor: IOmnichannelRoom['v'];
	visitorInfo: ILivechatVisitorInfo;
};

export const OmnichannelRoomContext = createContext<OmnichannelRoomContextValue | null>(null);

export const useOmnichannelVisitorInfo = (): OmnichannelRoomContextValue['visitorInfo'] => {
	const { visitorInfo } = useContext(OmnichannelRoomContext) || {};
	if (!visitorInfo) {
		throw new Error('use useRoom only inside opened rooms');
	}
	return visitorInfo;
};