import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type HeaderContentRowProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderContentRow = (props: HeaderContentRowProps) => (
	<Box alignItems='center' flexShrink={1} flexGrow={1} display='flex' {...props} />
);

export default HeaderContentRow;
