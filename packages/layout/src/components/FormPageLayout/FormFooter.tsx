import { Box } from '@rocket.chat/fuselage';
import type { FormHTMLAttributes, ReactNode, RefAttributes } from 'react';

export type FormFooterProps = Omit<FormHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

function FormFooter(props: FormFooterProps) {
	return <Box is='footer' marginBlockStart={24} display='flex' alignItems='center' justifyContent='space-between' {...props} />;
}

export default FormFooter;
