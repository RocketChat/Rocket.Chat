import type { AppStatus } from '@rocket.chat/apps';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import { Box, Menu, Palette, Tag } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '../../../../../components/GenericTable';
import AccordionLoading from '../../../components/AccordionLoading';
import { useAppInstances } from '../../../hooks/useAppInstances';

const AppInstances = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const { data, isSuccess, isError, isLoading } = useAppInstances({ appId: id });

	const getStatusColor = (status: AppStatus) => {
		if (AppStatusUtils.isDisabled(status) || AppStatusUtils.isError(status)) {
			return Palette.text['font-danger'].toString();
		}

		return Palette.text['font-default'].toString();
	};

	const router = useRouter();

	const handleSelectLogs = () => {
		router.navigate(
			{
				name: 'marketplace',
				params: { ...router.getRouteParameters(), tab: 'logs' },
			},
			{ replace: true },
		);
	};

	return (
		<Box h='full' w='full' marginInline='auto' color='default' pbs={24}>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && data.clusterStatus && data.clusterStatus.length > 0 && (
				<CustomScrollbars>
					<GenericTable w='full'>
						<GenericTableHeader>
							<GenericTableHeaderCell key='instanceId'>{t('Workspace_instance')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='status'>{t('Status')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='actions' width={64} />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.clusterStatus?.map((instance) => (
								<GenericTableRow key={instance.instanceId}>
									<GenericTableCell>{instance.instanceId}</GenericTableCell>
									<GenericTableCell>
										<Box justifyContent='flex-start' display='flex'>
											<Tag medium color={getStatusColor(instance.status)}>
												{t(`App_status_${instance.status}`)}
											</Tag>
										</Box>
									</GenericTableCell>
									<GenericTableCell>
										<Menu
											aria-label='actions'
											options={{ viewLogs: { label: t('Logs'), action: handleSelectLogs, type: 'option' } }}
										></Menu>
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
