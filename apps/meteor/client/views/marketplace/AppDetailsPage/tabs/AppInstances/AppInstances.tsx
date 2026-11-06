import type { AppStatus } from '@rocket.chat/apps';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import { Box, Tag, type TableColumnWidth } from '@rocket.chat/fuselage';
import {
	GenericMenu,
	CustomScrollbars,
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import AccordionLoading from '../../../components/AccordionLoading';
import { useAppInstances } from '../../../hooks/useAppInstances';

type AppInstanceProps = {
	id: string;
};

const AppInstances = ({ id }: AppInstanceProps) => {
	const { t } = useTranslation();
	const { data, isSuccess, isError, isLoading } = useAppInstances({ appId: id });

	const isFailing = (status: AppStatus) => AppStatusUtils.isDisabled(status) || AppStatusUtils.isError(status);

	const router = useRouter();

	const handleSelectLogs = (instanceId: string) => {
		router.navigate(
			{
				name: 'marketplace',
				params: { ...router.getRouteParameters(), tab: 'logs' },
				search: { instanceId },
			},
			{ replace: true },
		);
	};

	const columns: TableColumnWidth[] = ['auto', 'auto', 64];

	return (
		<Box height='full' width='full' marginInline='auto' color='default' paddingBlockStart={24}>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && data.clusterStatus && data.clusterStatus.length > 0 && (
				<CustomScrollbars>
					<GenericTable columns={columns}>
						<GenericTableHeader>
							<GenericTableHeaderCell key='instanceId'>{t('Workspace_instance')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='status'>{t('Status')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='actions' />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.clusterStatus?.map((instance) => (
								<GenericTableRow key={instance.instanceId}>
									<GenericTableCell>{instance.instanceId}</GenericTableCell>
									<GenericTableCell>
										<Box justifyContent='flex-start' display='flex'>
											<Tag medium variant={isFailing(instance.status) ? 'secondary-danger' : undefined}>
												{t(`App_status_${instance.status}`)}
											</Tag>
										</Box>
									</GenericTableCell>
									<GenericTableCell>
										<GenericMenu
											title='Actions'
											items={[
												{
													content: t('View_Logs'),
													onClick: () => handleSelectLogs(instance.instanceId),
													id: 'view-logs',
													icon: 'desktop-text',
												},
											]}
										/>
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
				</CustomScrollbars>
			)}
			{isSuccess && (!data.clusterStatus || data.clusterStatus.length === 0) && (
				<CustomScrollbars>
					<GenericNoResults />
				</CustomScrollbars>
			)}
		</Box>
	);
};

export default AppInstances;
