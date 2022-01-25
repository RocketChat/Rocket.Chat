import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Row: FC<any> = (props) => <Box alignItems='center' flexShrink={1} flexGrow={1} display='flex' {...props} />;

export default Row;
