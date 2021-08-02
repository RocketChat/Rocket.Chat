import { ButtonGroup } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const TagGroup: FC<ComponentProps<typeof ButtonGroup>> = (props) => (
	<ButtonGroup flexShrink={0} display='flex' flexWrap='wrap' withTruncatedText {...props} />
);

export default TagGroup;
