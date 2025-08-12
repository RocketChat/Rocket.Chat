import { Tabs, Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';

import DepartmentsTableV2 from './DepartmentsTable';
import EditDepartmentWithData from './EditDepartmentWithData';
import NewDepartment from './NewDepartment';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const DepartmentsPage = () => {
	const t = useTranslation();
	const departmentsRoute = useRoute('omnichannel-departments');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleTabClick = useEffectEvent((tab: undefined | 'archived') =>
		departmentsRoute.push(
			tab
				? {
						context: tab,
					}
				: {},
		),
	);

	const onAddNew = useEffectEvent(() =>
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
				<PageHeader title={t('Departments')}>
					<Button onClick={onAddNew}>{t('Create_department')}</Button>
				</PageHeader>
				<Tabs>
					<Tabs.Item key='departments' selected={!context} onClick={() => handleTabClick(undefined)}>
						{t('All')}
					</Tabs.Item>
					<Tabs.Item key='archived' selected={context === 'archived'} onClick={() => handleTabClick('archived')}>
						{t('Archived')}
					</Tabs.Item>
				</Tabs>
				<PageContent>
					<DepartmentsTableV2 archived={context === 'archived'} />
				</PageContent>
			</Page>
		</Page>
	);
};

export default DepartmentsPage;
