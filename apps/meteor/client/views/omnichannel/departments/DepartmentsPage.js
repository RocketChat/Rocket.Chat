import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';

function DepartmentsPage({ data, header, setParams, params, title, renderRow, children }) {
	const departmentsRoute = useRoute('omnichannel-departments');

	const t = useTranslation();

	const onAddNew = useMutableCallback(() =>
		departmentsRoute.push({
			context: 'new',
		}),
	);
	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<Button onClick={onAddNew}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow}
						results={data && data.departments}
						total={data && data.total}
						setParams={setParams}
						params={params}
						renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
					/>
				</Page.Content>
			</Page>
			{children}
		</Page>
	);
}

export default DepartmentsPage;
