import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

type ContentProps = ComponentProps<typeof Box>;

const Content: FC<ContentProps> = (props) => <Box display='flex' mb='x4' mi='neg-x4' {...props} />;

export default Content;
