import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

export type PageContentProps = BoxProps & RefAttributes<HTMLElement>;

const PageContent = ({ ref, ...props }: PageContentProps) => (
	<Box ref={ref} paddingInline={24} display='flex' flexDirection='column' overflowY='hidden' height='full' {...props} />
);

export default PageContent;
