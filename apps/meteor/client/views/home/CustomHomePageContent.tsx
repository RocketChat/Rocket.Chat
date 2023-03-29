import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

const CustomHomePageContent = (props: ComponentProps<typeof Box>): ReactElement => {
	const body = String(useSetting('Layout_Home_Body'));

	return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} {...props} />;
};

export default CustomHomePageContent;
