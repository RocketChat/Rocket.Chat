import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Info = (props) => (
	<Box mbe='x4' is='span' fontScale='p3' color='hint' withTruncatedText {...props} />
);

export default Info;
