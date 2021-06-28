import { ButtonGroup } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const TagGroup: FC<ComponentProps<typeof ButtonGroup>> = (props) => (
	<ButtonGroup
		flexShrink={0}
		flexWrap='nowrap'
		withTruncatedText
		{...props}
	/>
);

export default TagGroup;
