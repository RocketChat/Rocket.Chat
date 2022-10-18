import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const CardColSection: FC<ComponentProps<typeof Box>> = (props) => <Box rcx-card-col-section mb='x8' color='hint' {...props} />;

export default CardColSection;
