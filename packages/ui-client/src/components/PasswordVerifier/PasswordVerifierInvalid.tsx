import { PasswordVerifierItem } from './PasswordVerifierItem';

export const PasswordVerifierItemInvalid = ({ text }: { text: string }) => (
	<PasswordVerifierItem text={text} color='status-font-on-danger' icon='error-circle' />
);
