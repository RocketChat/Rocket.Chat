import { useSetting } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes, ReactNode } from 'react';

import HorizontalTemplate from './template/HorizontalTemplate';
import VerticalTemplate from './template/VerticalTemplate';

type RegisterTemplateProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const RegisterTemplate = ({ children, ...props }: RegisterTemplateProps) => {
	const template = useSetting<'vertical-template' | 'horizontal-template'>('Layout_Login_Template', 'horizontal-template');

	return (
		<main {...props}>
			{template === 'vertical-template' && <VerticalTemplate>{children}</VerticalTemplate>}
			{template === 'horizontal-template' && <HorizontalTemplate>{children}</HorizontalTemplate>}
		</main>
	);
};

export default RegisterTemplate;
