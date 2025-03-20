import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import HorizontalTemplate from './template/HorizontalTemplate';
import VerticalTemplate from './template/VerticalTemplate';

type RegisterTemplateProps = {
	children: ReactNode;
};

const RegisterTemplate = ({ children }: RegisterTemplateProps) => {
	const template = useSetting<'vertical-template' | 'horizontal-template'>('Layout_Login_Template', 'horizontal-template');

	return (
		<main>
			{template === 'vertical-template' && <VerticalTemplate>{children}</VerticalTemplate>}
			{template === 'horizontal-template' && <HorizontalTemplate>{children}</HorizontalTemplate>}
		</main>
	);
};

export default RegisterTemplate;
