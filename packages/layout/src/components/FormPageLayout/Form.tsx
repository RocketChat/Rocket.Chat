import { Tile } from '@rocket.chat/fuselage';
import type { FormHTMLAttributes, ReactNode, RefAttributes } from 'react';

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'is'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

function Form(props: FormProps) {
	return <Tile is='form' backgroundColor='light' color='default' padding={40} width='full' maxWidth={576} textAlign='left' {...props} />;
}

export default Form;
