import { InputBox, type InputBoxProps } from '../InputBox';

export type EmailInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * Takes an email address, and shows as invalid while the value isn't a well-formed one.
 */
function EmailInput(props: EmailInputProps) {
	return <InputBox type='email' {...props} />;
}

export default EmailInput;
