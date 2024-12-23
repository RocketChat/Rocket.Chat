import type { ReactElement } from 'react';
import React from 'react';

import AppsPageContent from './AppsPageContent';
import { Page } from '../../../components/Page';

const AppsPage = (): ReactElement => {
	return (
		<Page background='tint'>
			<AppsPageContent />
		</Page>
	);
};

export default AppsPage;
