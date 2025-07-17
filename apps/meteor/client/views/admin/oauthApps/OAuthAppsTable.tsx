import { useEndpoint, useRoute, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback } from 'react';

import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTableHeaderCell,
	GenericTable,
	GenericTableHeader,
	GenericTableRow,
	GenericTableCell,
	GenericTableBody,
	GenericTableLoadingRow,
} from '../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

const OAuthAppsTable = (): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const uid = { uid: useUserId() || '' };

	const getOauthApps = useEndpoint('GET', '/v1/oauth-apps.list');
	const { data, isLoading, isSuccess } = useQuery({
		queryKey: ['oauth-apps', { uid }],

		queryFn: async () => {
			const oauthApps = await getOauthApps(uid);
			return oauthApps;
		},
	});

	const router = useRoute('admin-oauth-apps');

	const onClick = useCallback(
		(_id: string) => (): void =>
			router.push({
				context: 'edit',
				id: _id,
			}),
		[router],
	);

	const headers = (
		<>
			<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='_createdBy'>{t('Created_by')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='_createdAt'>{t('Created_at')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.oauthApps.length === 0 && <GenericNoResults />}
			{isSuccess && data?.oauthApps.length > 0 && (
				<GenericTable aria-label={t('Third_party_applications_table')}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{data?.oauthApps.map(({ _id, name, _createdAt, _createdBy: { username: createdBy } }) => (
							<GenericTableRow
								key={_id}
								onKeyDown={onClick(_id)}
								onClick={onClick(_id)}
								tabIndex={0}
								role='link'
								action
								qa-oauth-app-id={_id}
							>
								<GenericTableCell withTruncatedText color='default' fontScale='p2m'>
									{name}
								</GenericTableCell>
								<GenericTableCell withTruncatedText>{createdBy}</GenericTableCell>
								<GenericTableCell withTruncatedText>{formatDateAndTime(_createdAt)}</GenericTableCell>
							</GenericTableRow>
						))}
					</GenericTableBody>
				</GenericTable>
			)}
		</>
	);
};

export default OAuthAppsTable;
