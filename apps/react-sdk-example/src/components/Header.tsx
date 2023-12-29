import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

const Header = (props: ComponentProps<typeof Box>) => {
	return <Box is='header' borderBlockEndWidth='default' fontScale='h1' p={16} borderBlockEndColor='extra-light' {...props} />;
};

export default Header;
