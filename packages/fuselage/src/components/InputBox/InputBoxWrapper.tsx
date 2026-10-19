import { Box, type BoxProps } from '../Box';
import { Label } from '../Label';

export type InputBoxWrapperProps = BoxProps;

const InputBoxWrapper = (props: InputBoxWrapperProps) => <Box animated is={Label} rcx-input-box__wrapper {...props} />;

export default InputBoxWrapper;
