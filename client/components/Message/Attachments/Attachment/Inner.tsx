import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Inner: FC<BoxProps> = ({ ...props }) => <Box {...props} />;

export default Inner;
