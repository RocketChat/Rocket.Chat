import {
	Button,
	Icon,
	Table,
	Box,
} from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';
import moment from 'moment';

import Page from '../../../components/Page';
import { useModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import GenericTable from '../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';


function InviteRow({ _id, createdAt, expires, days, uses, maxUses, onRemove }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const modal = useModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const removeInvite = useEndpoint('DELETE', `removeInvite/${ _id }`);

	const daysToExpire = ({ expires, days }) => {
		if (days > 0) {
			if (expires < Date.now()) {
				return t('Expired');
			}

			return moment(expires).fromNow(true);
		}

		return t('Never');
	};

	const maxUsesLeft = ({ maxUses, uses }) => {
		if (maxUses > 0) {
			if (uses >= maxUses) {
				return 0;
			}

			return maxUses - uses;
		}

		return t('Unlimited');
	};

	const handleRemoveButtonClick = async (event) => {
		event.stopPropagation();

		modal.open({ // TODO REFACTOR
			text: t('Are_you_sure_you_want_to_delete_this_record'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
			closeOnConfirm: true,
			html: false,
		}, async (confirmed) => {
			if (!confirmed) {
				return;
			}

			try {
				await removeInvite();
				onRemove && onRemove(_id);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		});
	};

	const notSmall = useMediaQuery('(min-width: 768px)');

	return <Table.Row>
		<Table.Cell>
			<Box color='hint' fontScale='p1'>{_id}</Box>
		</Table.Cell>
		{notSmall && <>
			<Table.Cell>
				{formatDateAndTime(createdAt)}
			</Table.Cell>
			<Table.Cell>
				{daysToExpire({ expires, days })}
			</Table.Cell>
			<Table.Cell>
				{uses}
			</Table.Cell>
			<Table.Cell>
				{maxUsesLeft({ maxUses, uses })}
			</Table.Cell>
		</>}
		<Table.Cell>
			<Button ghost danger small square onClick={handleRemoveButtonClick}>
				<Icon name='cross' size='x20' />
			</Button>
		</Table.Cell>
	</Table.Row>;
}

function InvitesPage() {
	const t = useTranslation();

	const [invites, setInvites] = useState([]);

	const listInvites = useEndpoint('GET', 'listInvites');

	useEffect(() => {
		const loadInvites = async () => {
			const result = await listInvites() || [];

			const invites = result.map((data) => ({
				...data,
				createdAt: new Date(data.createdAt),
				expires: data.expires ? new Date(data.expires) : '',
			}));

			setInvites(invites);
		};

		loadInvites();
	}, [listInvites]);

	const handleInviteRemove = (_id) => {
		setInvites((invites = []) => invites.filter((invite) => invite._id !== _id));
	};

	const notSmall = useMediaQuery('(min-width: 768px)');

	return <Page>
		<Page.Header title={t('Invites')} />
		<Page.Content>
			<GenericTable
				results={invites}
				header={
					<>
						<Table.Cell is='th' width={notSmall ? '20%' : '80%'}>{t('Token')}</Table.Cell>
						{ notSmall && <>
							<Table.Cell is='th' width='35%'>{t('Created_at')}</Table.Cell>
							<Table.Cell is='th' width='20%'>{t('Expiration')}</Table.Cell>
							<Table.Cell is='th' width='10%'>{t('Uses')}</Table.Cell>
							<Table.Cell is='th' width='10%'>{t('Uses_left')}</Table.Cell>
						</>}
						<Table.Cell is='th' />
					</>
				}
				renderRow={(invite) => <InviteRow key={invite._id} {...invite} onRemove={handleInviteRemove} />}
			/>
		</Page.Content>
	</Page>;
}

export default InvitesPage;
