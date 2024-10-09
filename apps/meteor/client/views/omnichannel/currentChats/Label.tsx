import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

type LabelProps = ComponentProps<typeof Box>;

const Label = (props: LabelProps) => <Box fontScale='p2m' color='default' {...props} />;

export default Label;
