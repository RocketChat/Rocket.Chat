import { Box } from '@rocket.chat/fuselage';
import type { FormHTMLAttributes, ReactNode, RefAttributes } from 'react';

export type FormSubtitleProps = Omit<FormHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

function FormSubtitle(props: FormSubtitleProps) {
	return <Box fontScale='p2' color='hint' {...props} />;
}

export default FormSubtitle;
