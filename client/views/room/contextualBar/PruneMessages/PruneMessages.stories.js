import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import PruneMessages from './PruneMessages';

export default {
	title: 'room/contextualBar/PruneMessages',
	component: PruneMessages,
};

export const Default = () => (
	<VerticalBar>
		<PruneMessages onClickClose={alert} />
	</VerticalBar>
);

export const withCallout = () => (
	<VerticalBar>
		<PruneMessages onClickClose={alert} pinned={true} callOutText='Lorem Ipsum Ipsum Ipsum' />
	</VerticalBar>
);
