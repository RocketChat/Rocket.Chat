import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Title: FC<ComponentProps<typeof Box>> = (props) => <Box withTruncatedText mi='x2' fontScale='c1' color='hint' {...props}></Box>;

export default Title;
