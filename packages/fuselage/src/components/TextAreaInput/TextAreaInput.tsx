import { InputBox, type InputBoxProps } from '../InputBox';

export type TextAreaInputProps = Omit<InputBoxProps<HTMLTextAreaElement>, 'type'>;

/**
 * An input for multi-line plain-text editing.
 */
function TextAreaInput(props: TextAreaInputProps) {
	return <InputBox {...props} type='textarea' />;
}

export default TextAreaInput;
