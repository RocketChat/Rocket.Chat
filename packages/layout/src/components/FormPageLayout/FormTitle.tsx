import { Box } from '@rocket.chat/fuselage';
import type { FormHTMLAttributes, ReactNode, RefAttributes } from 'react';

export type FormTitleProps = Omit<FormHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

function FormTitle(props: FormTitleProps) {
	return <Box marginBlockEnd={8} fontScale='h3' fontWeight={800} {...props} />;
}

export default FormTitle;
