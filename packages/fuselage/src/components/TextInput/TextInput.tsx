import { InputBox, type InputBoxProps } from '../InputBox';

export type TextInputProps = Omit<InputBoxProps, 'type'>;

/**
 * An input for any kind of single-line text.
 */
function TextInput(props: TextInputProps) {
	return <InputBox type='text' {...props} />;
}

export default TextInput;
