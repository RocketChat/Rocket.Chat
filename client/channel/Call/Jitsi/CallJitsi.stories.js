import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import VerticalBar from '../../../components/basic/VerticalBar';
import { CallJitsi } from './CallJitsi';

export default {
	title: 'components/basic/CallJitsi',
	component: CallJitsi,
};

export const Default = () => <Box height='600px'>
	<VerticalBar>
		<CallJitsi handleWindow={true}/>
	</VerticalBar>
</Box>;
