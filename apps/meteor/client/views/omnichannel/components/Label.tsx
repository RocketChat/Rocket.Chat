import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const Label: FC<ComponentProps<typeof Box>> = (props) => <Box mbe={8} fontScale='p2m' color='default' {...props} />;

export default Label;
