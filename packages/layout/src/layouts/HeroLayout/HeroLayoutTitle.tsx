import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const HeroLayoutTitle = ({ children }: { children: ReactNode }) => <Box fontScale='hero'>{children}</Box>;

export default HeroLayoutTitle;
