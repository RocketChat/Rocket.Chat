import { InputBox, type InputBoxProps } from '../InputBox';

export type TextInputProps = Omit<InputBoxProps, 'type'>;

/**
 * Takes a single line of free text, such as a name or a title.
 */
function TextInput(props: TextInputProps) {
	return <InputBox type='text' {...props} />;
}

export default TextInput;
