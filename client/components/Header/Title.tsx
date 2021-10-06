import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Title: FC<any> = (props) => (
	<Box color='default' mi='x4' fontScale='s2' withTruncatedText {...props} />
);

export default Title;
