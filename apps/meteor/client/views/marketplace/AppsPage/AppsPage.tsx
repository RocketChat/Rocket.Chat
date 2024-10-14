import type { ReactElement } from 'react';
import React from 'react';

import { Page } from '../../../components/Page';
import AppsPageContent from './AppsPageContent';

const AppsPage = (): ReactElement => {
	return (
		<Page background='tint'>
			<AppsPageContent />
		</Page>
	);
};

export default AppsPage;
