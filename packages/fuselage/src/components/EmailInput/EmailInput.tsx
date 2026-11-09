import { InputBox, type InputBoxProps } from '../InputBox/index.js';

export type EmailInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * An input for email addresses.
 */
function EmailInput(props: EmailInputProps) {
	return <InputBox type='email' {...props} />;
}

export default EmailInput;
