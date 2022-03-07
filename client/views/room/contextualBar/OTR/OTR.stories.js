import React from 'react';

import { OtrRoomState } from '../../../../../app/otr/client/OtrRoomState';
import VerticalBar from '../../../../components/VerticalBar';
import OTR from './OTR';

export default {
	title: 'room/contextualBar/OTR',
	component: OTR,
};

export const Establishing = () => (
	<VerticalBar>
		<OTR
			onClickClose={alert}
			onClickStart={alert}
			onClickEnd={alert}
			onClickRefresh={alert}
			isOnline={true}
			otrState={OtrRoomState.ESTABLISHING}
		/>
	</VerticalBar>
);

export const Established = () => (
	<VerticalBar>
		<OTR
			onClickClose={alert}
			onClickStart={alert}
			onClickEnd={alert}
			onClickRefresh={alert}
			isOnline={true}
			otrState={OtrRoomState.ESTABLISHED}
		/>
	</VerticalBar>
);

export const Timeout = () => (
	<VerticalBar>
		<OTR
			onClickClose={alert}
			onClickStart={alert}
			onClickEnd={alert}
			onClickRefresh={alert}
			isOnline={true}
			otrState={OtrRoomState.TIMEOUT}
		/>
	</VerticalBar>
);

export const Declined = () => (
	<VerticalBar>
		<OTR
			onClickClose={alert}
			onClickStart={alert}
			onClickEnd={alert}
			onClickRefresh={alert}
			isOnline={true}
			otrState={OtrRoomState.DECLINED}
		/>
	</VerticalBar>
);

export const Unavailable = () => (
	<VerticalBar>
		<OTR onClickClose={alert} onClickStart={alert} onClickEnd={alert} onClickRefresh={alert} isOnline={false} />
	</VerticalBar>
);
