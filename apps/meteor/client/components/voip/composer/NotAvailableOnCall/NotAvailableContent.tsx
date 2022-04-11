import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

type ContentPropsType = {
	icon: ComponentProps<typeof Icon>['name'];
	text: string;
};

const NotAvailableContent = ({ icon, text }: ContentPropsType): ReactElement => (
	<Box w='full' h='full' display='flex' flexDirection='row' alignItems='center' justifyContent='center'>
		<Icon color='info' size='24px' name={icon} />
		<Box mis='4px' fontScale='p2' color='info'>
			{text}
		</Box>
	</Box>
);

export default NotAvailableContent;
