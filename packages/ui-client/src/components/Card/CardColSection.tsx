import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const CardColSection: FC<ComponentProps<typeof Box>> = (props) => <Box rcx-card-col-section mb={8} color='default' {...props} />;

export default CardColSection;
