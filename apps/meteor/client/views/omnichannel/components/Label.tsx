import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type LabelProps = ComponentProps<typeof Box>;

const Label = (props: LabelProps) => <Box mbe={8} fontScale='p2m' color='default' {...props} />;
export default Label;
