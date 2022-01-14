import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import OTR from './OTR';

export default {
	title: 'room/contextualBar/OTR',
	component: OTR,
};

export const Default = () => (
	<VerticalBar>
		<OTR onClickClose={alert} onClickStart={alert} onClickEnd={alert} onClickRefresh={alert} isOnline={true} />
	</VerticalBar>
);

export const Establishing = () => (
	<VerticalBar>
		<OTR onClickClose={alert} onClickStart={alert} onClickEnd={alert} onClickRefresh={alert} isOnline={true} isEstablishing={true} />
	</VerticalBar>
);

export const Established = () => (
	<VerticalBar>
		<OTR onClickClose={alert} onClickStart={alert} onClickEnd={alert} onClickRefresh={alert} isOnline={true} isEstablished={true} />
	</VerticalBar>
);

export const Unavailable = () => (
	<VerticalBar>
		<OTR onClickClose={alert} onClickStart={alert} onClickEnd={alert} onClickRefresh={alert} isOnline={false} />
	</VerticalBar>
);
