import React, { Suspense, memo, ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';

import PageLoading from '../../root/PageLoading';
import { getI18n } from '../utils/i18n';

const I18nProvider = ({ children }: { children: ReactElement }): ReactElement => (
	<Suspense fallback={<PageLoading />}>
		<I18nextProvider i18n={getI18n()}>{children}</I18nextProvider>
	</Suspense>
);

export default memo(I18nProvider);
