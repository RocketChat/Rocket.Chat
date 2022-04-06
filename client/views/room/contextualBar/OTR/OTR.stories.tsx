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
			peerUsername='username'
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
			peerUsername='username'
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
			peerUsername='username'
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
			peerUsername='username'
		/>
	</VerticalBar>
);

export const Unavailable = () => (
	<VerticalBar>
		<OTR
			onClickClose={alert}
			onClickStart={alert}
			onClickEnd={alert}
			onClickRefresh={alert}
			isOnline={false}
			otrState={OtrRoomState.NOT_STARTED}
			peerUsername='username'
		/>
	</VerticalBar>
);
