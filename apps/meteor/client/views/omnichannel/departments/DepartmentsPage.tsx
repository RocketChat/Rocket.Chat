import { Tabs, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import DepartmentsTableV2 from './DepartmentsTable';
import EditDepartmentWithData from './EditDepartmentWithData';
import NewDepartment from './NewDepartment';

const DepartmentsPage = () => {
	const t = useTranslation();
	const departmentsRoute = useRoute('omnichannel-departments');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleTabClick = useMutableCallback((tab) =>
		departmentsRoute.push({
			context: tab,
		}),
	);

	const onAddNew = useMutableCallback(() =>
		departmentsRoute.push({
			context: 'new',
		}),
	);

	if (context === 'new') {
		return <NewDepartment id={id} />;
	}

	if (context === 'edit') {
		return <EditDepartmentWithData id={id} title={t('Edit_Department')} />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Departments')}>
					<Button onClick={onAddNew}>{t('Create_department')}</Button>
				</Page.Header>
				<Tabs>
					<Tabs.Item key='departments' selected={!context} onClick={() => handleTabClick(undefined)}>
						{t('All')}
					</Tabs.Item>
					<Tabs.Item key='archived' selected={context === 'archived'} onClick={() => handleTabClick('archived')}>
						{t('Archived')}
					</Tabs.Item>
				</Tabs>
				<Page.Content>
					<DepartmentsTableV2 archived={context === 'archived'} />
				</Page.Content>
			</Page>
		</Page>
	);
};

export default DepartmentsPage;
