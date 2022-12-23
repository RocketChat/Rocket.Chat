import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

type ContentProps = ComponentProps<typeof Box>;

const Content = (props: ContentProps): ReactElement => <Box display='flex' mb={4} mi={-4} {...props} />;

export default Content;
