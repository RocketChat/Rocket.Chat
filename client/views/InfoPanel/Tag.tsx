import { Chip } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Tag: FC<ComponentProps<typeof Chip> & { label: string }> = ({
	label,
	...props
}) => (
	<Chip title={label} aria-label={label} {...props} mi='x4'>
		# {label}
	</Chip>
);

export default Tag;