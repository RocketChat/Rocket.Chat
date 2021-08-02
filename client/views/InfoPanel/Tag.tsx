import { Button } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Tag: FC<ComponentProps<typeof Button> & { tag: string }> = ({ tag, ...props }) => (
	<Button title={tag} aria-label={tag} {...props} m='x4' small color='info' fontWeight='normal'>
		{`# ${tag}`}
	</Button>
);

export default Tag;
