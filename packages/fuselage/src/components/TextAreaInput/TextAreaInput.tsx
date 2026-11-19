import { InputBox, type InputBoxProps } from '../InputBox';

export type TextAreaInputProps = Omit<InputBoxProps<HTMLTextAreaElement>, 'type'>;

/**
 * Takes plain text over several lines, such as a description or a message.
 */
function TextAreaInput(props: TextAreaInputProps) {
	return <InputBox type='textarea' {...props} />;
}

export default TextAreaInput;
