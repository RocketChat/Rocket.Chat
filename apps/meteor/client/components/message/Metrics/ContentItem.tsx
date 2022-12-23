import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

type ContentItemProps = ComponentProps<typeof Box>;

const ContentItem: FC<ContentItemProps> = (props) => <Box display='flex' mb='x4' mi='x4' {...props} />;

export default ContentItem;
