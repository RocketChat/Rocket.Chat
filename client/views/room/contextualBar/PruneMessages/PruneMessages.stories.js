import React from 'react';

import { PruneMessages } from './PruneMessages';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'components/PruneMessages',
	component: PruneMessages,
};

export const Default = () => <VerticalBar>
	<PruneMessages
		onClickClose={alert}
	/>
</VerticalBar>;

export const withCallout = () => <VerticalBar>
	<PruneMessages
		onClickClose={alert}
		pinned={true}
		callOutText='Lorem Ipsum Ipsum Ipsum'
	/>
</VerticalBar>;
