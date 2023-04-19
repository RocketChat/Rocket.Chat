import { Tabs, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, usePermission, useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ArchivedDepartmentsPageWithData from './ArchivedDepartmentsPageWithData';
import DepartmentsPageWithData from './DepartmentsPageWithData';
import EditDepartmentWithData from './EditDepartmentWithData';
import NewDepartment from './NewDepartment';

function DepartmentsRoute() {
	const t = useTranslation();
	const canViewDepartments = usePermission('manage-livechat-departments');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const departmentsRoute = useRoute('omnichannel-departments');

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

	if (!canViewDepartments) {
		return <NotAuthorizedPage />;
	}

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
					<Button onClick={onAddNew}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>

				<Tabs>
					<Tabs.Item key={'departments'} selected={!context} onClick={() => handleTabClick(undefined)}>
						{t('All')}
					</Tabs.Item>
					<Tabs.Item key={'archived'} selected={context === 'archived'} onClick={() => handleTabClick('archived')}>
						{t('Archived')}
					</Tabs.Item>
				</Tabs>

				<Page.Content>{context === 'archived' ? <ArchivedDepartmentsPageWithData /> : <DepartmentsPageWithData />}</Page.Content>
			</Page>
		</Page>
	);
}

export default DepartmentsRoute;
