import { Button, Icon, Table, Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React from 'react';

import { useModal } from '../../../contexts/ModalContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

function InviteRow({ _id, createdAt, expires, days, uses, maxUses, onRemove }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const modal = useModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const removeInvite = useEndpoint('DELETE', `removeInvite/${_id}`);

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

		modal.open(
			{
				// TODO REFACTOR
				text: t('Are_you_sure_you_want_to_delete_this_record'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('No'),
				closeOnConfirm: true,
				html: false,
			},
			async (confirmed) => {
				if (!confirmed) {
					return;
				}

				try {
					await removeInvite();
					onRemove && onRemove(_id);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			},
		);
	};

	const notSmall = useMediaQuery('(min-width: 768px)');

	return (
		<Table.Row>
			<Table.Cell>
				<Box color='hint' fontScale='p1'>
					{_id}
				</Box>
			</Table.Cell>
			{notSmall && (
				<>
					<Table.Cell>{formatDateAndTime(createdAt)}</Table.Cell>
					<Table.Cell>{daysToExpire({ expires, days })}</Table.Cell>
					<Table.Cell>{uses}</Table.Cell>
					<Table.Cell>{maxUsesLeft({ maxUses, uses })}</Table.Cell>
				</>
			)}
			<Table.Cell>
				<Button ghost danger small square onClick={handleRemoveButtonClick}>
					<Icon name='cross' size='x20' />
				</Button>
			</Table.Cell>
		</Table.Row>
	);
}

export default InviteRow;
