import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

const CustomHomePageContent = (props: ComponentProps<typeof Box>) => {
	const body = useSetting('Layout_Home_Body', '');

	return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} {...props} />;
};

export default CustomHomePageContent;
