import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';

const HeaderTitle: FC<ComponentProps<typeof Box>> = (props) => (
	<Box color='default' mi={4} is='h1' fontScale='h4' withTruncatedText {...props} />
);

export default HeaderTitle;
