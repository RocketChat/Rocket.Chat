import { PasswordVerifierItem } from './PasswordVerifierItem';

export const PasswordVerifierItemCorrect = ({ text }: { text: string }) => (
	<PasswordVerifierItem text={text} color='status-font-on-success' icon='success-circle' />
);
