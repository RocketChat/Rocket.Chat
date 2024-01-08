import { useSetting } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';

import HorizontalTemplate from './template/HorizontalTemplate';
import VerticalTemplate from './template/VerticalTemplate';

const RegisterTemplate = ({ children, ...props }: AllHTMLAttributes<HTMLElement>) => {
	const template = useSetting<'vertical-template' | 'horizontal-template'>('Layout_Login_Template');

	return (
		<main>
			{template === 'vertical-template' && <VerticalTemplate {...props} children={children} />}
			{template === 'horizontal-template' && <HorizontalTemplate {...props} children={children} />}
		</main>
	);
};

export default RegisterTemplate;
