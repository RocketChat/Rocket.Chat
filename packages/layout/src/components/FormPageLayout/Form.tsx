import { Box, Tile } from '@rocket.chat/fuselage';
import type { FormHTMLAttributes, ReactNode, RefAttributes } from 'react';

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'is'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

function Form({ children, ...props }: FormProps) {
	return (
		<Box is='form' width='full' maxWidth={576} textAlign='left' {...props}>
			<Tile flush>
				<Box padding={40}>{children}</Box>
			</Tile>
		</Box>
	);
}

export default Form;
