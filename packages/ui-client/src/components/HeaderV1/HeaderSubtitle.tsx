import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type HeaderSubtitleProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderSubtitle = (props: HeaderSubtitleProps) => <Box color='hint' fontScale='p2' withTruncatedText {...props} />;

export default HeaderSubtitle;
