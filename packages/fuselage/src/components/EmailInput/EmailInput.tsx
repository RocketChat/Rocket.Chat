import { InputBox, type InputBoxProps } from '../InputBox';

export type EmailInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * An input for email addresses.
 */
function EmailInput(props: EmailInputProps) {
	return <InputBox {...props} type='email' />;
}

export default EmailInput;
