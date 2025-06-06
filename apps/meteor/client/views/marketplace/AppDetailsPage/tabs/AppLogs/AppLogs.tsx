import { Box, Pagination } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { Collapse } from './Components/Collapse';
import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { data, isSuccess, isError, isLoading } = useLogs({ appId: id, current, itemsPerPage });
	const collapseId = useId();

	return (
		<>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && (
				<CustomScrollbars>
					<Collapse width='100%' alignSelf='center'>
						{data?.logs?.map((log) => <AppLogsItem collapseId={collapseId} key={log._createdAt} {...log} />)}
					</Collapse>
				</CustomScrollbars>
			)}
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={data?.total || 0}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				{...paginationProps}
			/>
		</>
	);
};

export default AppLogs;
