import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type LabelProps = BoxProps;

const Label = (props: LabelProps) => <Box marginBlockEnd={8} fontScale='p2m' color='default' {...props} />;
export default Label;
