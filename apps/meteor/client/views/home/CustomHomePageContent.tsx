import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';

const CustomHomePageContent = (
	props: ComponentProps<typeof Box>,
): ReactElement => {
	const body = useSetting('Layout_Home_Body', '');

	return (
		<Box
			withRichContent
			width='100%'
			minWidth={0}                
			overflow='hidden'
			css={{
				// Ensure injected HTML is responsive
				'& *': {
					maxWidth: '100%',
				},
				// Fix buttons / links breaking on mobile
				'& button, & a': {
					flexWrap: 'wrap',
				},
			}}
			dangerouslySetInnerHTML={{ __html: body }}
			{...props}
		/>
	);
};

export default CustomHomePageContent;
