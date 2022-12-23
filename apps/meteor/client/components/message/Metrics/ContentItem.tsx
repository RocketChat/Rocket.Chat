import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

type ContentItemProps = ComponentProps<typeof Box>;

const ContentItem = (props: ContentItemProps): ReactElement => <Box display='flex' margin={4} {...props} />;

export default ContentItem;
