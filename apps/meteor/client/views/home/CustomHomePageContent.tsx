import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { ComponentProps, ReactElement } from 'react';

const CustomHomePageContent = (props: ComponentProps<typeof Box>): ReactElement => {
	const body = useSetting('Layout_Home_Body', '');
	const sanitized = DOMPurify.sanitize(body, {
		ADD_TAGS: ['iframe'],
		ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src'],
	});

	return <Box withRichContent dangerouslySetInnerHTML={{ __html: sanitized }} {...props} />;
};

export default CustomHomePageContent;
