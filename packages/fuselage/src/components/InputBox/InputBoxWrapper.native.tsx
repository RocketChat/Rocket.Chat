import type { InputBoxWrapperProps } from './InputBoxWrapper';
import { inputBoxChrome, inputBoxWrapperLayout } from './inputBoxStyleProps';
import { Box } from '../Box';

/** The native twin of `InputBoxWrapper`: a row drawn as an input, not a label, since a label is text on native. */
const InputBoxWrapper = (props: InputBoxWrapperProps) => (
	<Box animated rcx-input-box__wrapper {...inputBoxChrome({})} {...inputBoxWrapperLayout({})} {...props} />
);

export default InputBoxWrapper;
