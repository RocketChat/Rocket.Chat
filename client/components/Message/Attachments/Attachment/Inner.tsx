import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Inner: FC<ComponentProps<typeof Box>> = ({ ...props }) => <Box {...props} />;

export default Inner;
