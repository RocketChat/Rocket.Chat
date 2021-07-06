import { Button } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

import ContentItem from './ContentItem';

type ReplyProps = ComponentProps<typeof Button>;

const Reply: FC<ReplyProps> = (props) => (
	<ContentItem>
		<Button {...props} small primary />
	</ContentItem>
);

export default Reply;
