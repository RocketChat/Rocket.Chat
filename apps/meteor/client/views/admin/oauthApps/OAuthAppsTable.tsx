import { Table } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useCallback } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

const OAuthAppsTable = (): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const { value: data } = useEndpointData('/v1/oauth-apps.list');

	const router = useRoute('admin-oauth-apps');

	const onClick = useCallback(
		(_id) => (): void =>
			router.push({
				context: 'edit',
				id: _id,
			}),
		[router],
	);

	const header = useMemo(
		() => [
			<GenericTable.HeaderCell key={'name'}>{t('Name')}</GenericTable.HeaderCell>,
			<GenericTable.HeaderCell key={'_createdBy'}>{t('Created_by')}</GenericTable.HeaderCell>,
			<GenericTable.HeaderCell key={'_createdAt'}>{t('Created_at')}</GenericTable.HeaderCell>,
		],
		[t],
	);

	const renderRow = useCallback(
		({ _id, name, _createdAt, _createdBy: { username: createdBy } }) => (
			<Table.Row key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action qa-oauth-app-id={_id}>
				<Table.Cell withTruncatedText color='default' fontScale='p2m'>
					{name}
				</Table.Cell>
				<Table.Cell withTruncatedText>{createdBy}</Table.Cell>
				<Table.Cell withTruncatedText>{formatDateAndTime(_createdAt)}</Table.Cell>
			</Table.Row>
		),
		[formatDateAndTime, onClick],
	);

	return <GenericTable header={header} renderRow={renderRow} results={data?.oauthApps} />;
};

export default OAuthAppsTable;
