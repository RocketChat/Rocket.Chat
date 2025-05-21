import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ContextualbarAction from './ContextualbarAction';
import { isKeyboardNavigationActive } from '../../lib/utils/isKeyboardNavigationActive';

type ContextualbarCloseProps = Partial<ComponentProps<typeof ContextualbarAction>>;

const ContextualbarClose = (props: ContextualbarCloseProps): ReactElement => {
	const { t } = useTranslation();
	const shouldAutoFocus = useMemo(() => isKeyboardNavigationActive(), []);
	const autoFocusRef = useAutoFocus<HTMLElement>(shouldAutoFocus);

	return <ContextualbarAction data-qa='ContextualbarActionClose' {...props} aria-label={t('Close')} name='cross' ref={autoFocusRef} />;
};

export default memo(ContextualbarClose);
