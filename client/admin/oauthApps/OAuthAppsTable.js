import { Table } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback } from 'react';

import { GenericTable, Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';

export function OAuthAppsTable() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const { data } = useEndpointDataExperimental('oauth-apps.list', useMemo(() => ({}), []));

	const router = useRoute('admin-oauth-apps');

	const onClick = useCallback((_id) => () => router.push({
		context: 'edit',
		id: _id,
	}), [router]);

	const header = useMemo(() => [
		<Th key={'name'}>{t('Name')}</Th>,
		<Th key={'_createdBy'}>{t('Created_by')}</Th>,
		<Th key={'_createdAt'}>{t('Created_at')}</Th>,
	], [t]);

	const renderRow = useCallback(({ _id, name, _createdAt, _createdBy: { username: createdBy } }) =>
		<Table.Row key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action qa-oauth-app-id={_id}>
			<Table.Cell withTruncatedText color='default' fontScale='p2'>{name}</Table.Cell>
			<Table.Cell withTruncatedText>{createdBy}</Table.Cell>
			<Table.Cell withTruncatedText>{formatDateAndTime(_createdAt)}</Table.Cell>
		</Table.Row>, [formatDateAndTime, onClick]);

	return <GenericTable header={header} renderRow={renderRow} results={data && data.oauthApps} />;
}

export default OAuthAppsTable;
