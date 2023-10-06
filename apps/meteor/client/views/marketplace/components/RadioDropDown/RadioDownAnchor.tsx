import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef } from 'react';

import type { RadioDropDownGroup } from '../../definitions/RadioDropDownDefinitions';

type RadioDropdownAnchorProps = {
	onClick: (forcedValue?: React.SetStateAction<boolean> | undefined) => void;
	group: RadioDropDownGroup;
} & Omit<ComponentProps<typeof Button>, 'onClick'>;

const RadioDownAnchor = forwardRef<HTMLElement, RadioDropdownAnchorProps>(function SortDropDownAnchor({ onClick, group, ...props }, ref) {
	const selected = group?.items.find((item) => item.checked)?.label;

	return (
		<Box
			is={Button}
			ref={ref}
			onClick={onClick as any}
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			borderColor='light'
			borderWidth='x1'
			borderRadius='x4'
			bg='light'
			color='secondary-info'
			fontScale='p2'
			minWidth='x144'
			h='x40'
			flexGrow={1}
			flexShrink={1}
			{...props}
		>
			{selected}
			<Icon name='chevron-down' size='x20' />
		</Box>
	);
});

export default RadioDownAnchor;
