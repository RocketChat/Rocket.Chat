import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Subtitle: FC<any> = (props) => <Box color='hint' fontScale='p2' withTruncatedText {...props} />;

export default Subtitle;
