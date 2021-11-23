import { Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect, ReactElement } from 'react';

import { IInvite } from '../../../../definition/IInvite';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import InviteRow from './InviteRow';

const InvitesPage = (): ReactElement => {
	const t = useTranslation();
	const [invites, setInvites] = useState<Array<IInvite>>([]);
	const listInvites = useEndpoint('GET', 'listInvites');

	useEffect(() => {
		const loadInvites = async (): Promise<void> => {
			const result = (await listInvites()) || [];

			const invites = result.map((data: IInvite) => ({
				...data,
				createdAt: new Date(data.createdAt),
				expires: data.expires ? new Date(data.expires) : null,
			}));

			setInvites(invites);
		};

		loadInvites();
	}, [listInvites]);

	const handleInviteRemove = (_id: IInvite['_id']): void => {
		setInvites((invites) => invites.filter((invite) => invite._id !== _id));
	};

	const notSmall = useMediaQuery('(min-width: 768px)');

	return (
		<Page>
			<Page.Header title={t('Invites')} />
			<Page.Content>
				<GenericTable
					results={invites}
					header={
						<>
							<Table.Cell is='th' width={notSmall ? '20%' : '80%'}>
								{t('Token')}
							</Table.Cell>
							{notSmall && (
								<>
									<Table.Cell is='th' width='35%'>
										{t('Created_at')}
									</Table.Cell>
									<Table.Cell is='th' width='20%'>
										{t('Expiration')}
									</Table.Cell>
									<Table.Cell is='th' width='10%'>
										{t('Uses')}
									</Table.Cell>
									<Table.Cell is='th' width='10%'>
										{t('Uses_left')}
									</Table.Cell>
								</>
							)}
							<Table.Cell is='th' />
						</>
					}
					renderRow={(invite: IInvite): ReactElement => (
						<InviteRow key={invite._id} {...invite} onRemove={handleInviteRemove} />
					)}
				/>
			</Page.Content>
		</Page>
	);
};

export default InvitesPage;
