import React from 'react';

import { PruneMessages } from './PruneMessages';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'components/PruneMessages',
	component: PruneMessages,
};

export const Default = () => <VerticalBar>
	<PruneMessages
		onClickBack={alert}
		onClickClose={alert}
		onClickSave={alert}
		value={[]}
		errors={{}}
	/>
</VerticalBar>;
