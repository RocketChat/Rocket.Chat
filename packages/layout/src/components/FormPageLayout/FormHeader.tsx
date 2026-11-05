import { Box } from '@rocket.chat/fuselage';
import type { FormHTMLAttributes, ReactNode, RefAttributes } from 'react';

export type FormHeaderProps = Omit<FormHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

function FormHeader(props: FormHeaderProps) {
	return <Box is='header' marginBlockEnd={24} {...props} />;
}

export default FormHeader;
