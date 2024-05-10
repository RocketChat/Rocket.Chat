import type { FC } from 'react';
import React from 'react';

import LoadingIndicator from '../../components/LoadingIndicator';

const PageLoading: FC = () => (
	<div className='page-loading' role='alert' aria-busy='true' aria-live='polite' aria-label='loading'>
		<LoadingIndicator />
	</div>
);

export default PageLoading;
