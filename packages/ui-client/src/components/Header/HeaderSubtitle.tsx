import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type HeaderSubtitleProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderSubtitle = (props: HeaderSubtitleProps) => (
	<Box color='hint' fontScale='p2' paddingBlock='x4' flexGrow={1} withTruncatedText {...props} />
);

export default HeaderSubtitle;
