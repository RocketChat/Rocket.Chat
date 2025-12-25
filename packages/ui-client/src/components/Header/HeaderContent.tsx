import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type HeaderContentProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderContent = (props: HeaderContentProps) => (
	<Box flexGrow={1} width={1} flexShrink={1} mi={4} display='flex' justifyContent='center' flexDirection='column' {...props} />
);

export default HeaderContent;
