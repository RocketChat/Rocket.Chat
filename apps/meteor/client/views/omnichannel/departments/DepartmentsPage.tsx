import { Button } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import DepartmentsTable from './DepartmentsTable';
import EditDepartmentWithData from './EditDepartmentWithData';
import NewDepartment from './NewDepartment';
import { PageTabs } from '../../../components/PageTabs';

const DepartmentsPage = () => {
	const { t } = useTranslation();
	const departmentsRoute = useRoute('omnichannel-departments');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onAddNew = useStableCallback(() =>
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
				<PageTabs
					items={[
						{ id: '', label: t('All') },
						{ id: 'archived', label: t('Archived') },
					]}
					selected={context || ''}
					onSelect={(context) => departmentsRoute.push(context ? { context } : {})}
				/>
				<PageContent>
					<DepartmentsTable archived={context === 'archived'} />
				</PageContent>
			</Page>
		</Page>
	);
};

export default DepartmentsPage;
