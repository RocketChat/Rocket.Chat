import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import HorizontalTemplate from './template/HorizontalTemplate';
import VerticalTemplate from './template/VerticalTemplate';

const RegisterTemplate = ({ children }: { children: ReactElement }): ReactElement => {
	const template = useSetting<'vertical-template' | 'horizontal-template'>('Layout_Login_Template');

	if (template === 'vertical-template') {
		return <VerticalTemplate>{children}</VerticalTemplate>;
	}
	return <HorizontalTemplate>{children}</HorizontalTemplate>;
};

export default RegisterTemplate;
