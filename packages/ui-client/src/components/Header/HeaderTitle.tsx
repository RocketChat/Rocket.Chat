import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type HeaderTitleProps = ComponentPropsWithoutRef<typeof Box>;

const HeaderTitle = (props: HeaderTitleProps) => <Box color='titles-labels' mi={4} is='h1' fontScale='h4' withTruncatedText {...props} />;

export default HeaderTitle;
