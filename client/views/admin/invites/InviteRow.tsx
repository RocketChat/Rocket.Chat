import { Button, Icon, Table, Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React, { ReactElement, MouseEvent } from 'react';

import { IInvite } from '../../../../definition/IInvite';
import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

const isExpired = (expires: IInvite['expires']): boolean => {
	if (expires && expires.getTime() < new Date().getTime()) {
		return true;
	}

	return false;
};

type InviteRowProps = IInvite & {
	onRemove: (_id: IInvite['_id']) => void;
};

const InviteRow = ({
	_id,
	createdAt,
	expires,
	days,
	uses,
	maxUses,
	onRemove,
}: InviteRowProps): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();
	const removeInvite = useEndpoint('DELETE', `removeInvite/${_id}`);

	const daysToExpire = ({
		expires,
		days,
	}: {
		expires: IInvite['expires'];
		days: IInvite['days'];
	}): string => {
		if (days > 0) {
			if (isExpired(expires)) {
				return t('Expired');
			}

			return moment(expires).fromNow(true);
		}

		return t('Never');
	};

	const maxUsesLeft = ({
		maxUses,
		uses,
	}: {
		maxUses: IInvite['maxUses'];
		uses: IInvite['uses'];
	}): number | string => {
		if (maxUses > 0) {
			if (uses >= maxUses) {
				return 0;
			}

			return maxUses - uses;
		}

		return t('Unlimited');
	};

	const handleRemoveButtonClick = async (event: MouseEvent<HTMLElement>): Promise<void> => {
		event.stopPropagation();

		const confirmRemove = async (): Promise<void> => {
			try {
				await removeInvite();
				onRemove && onRemove(_id);
				dispatchToastMessage({ type: 'success', message: t('Invite_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(
			<GenericModal
				title={t('Are_you_sure')}
				children={t('Are_you_sure_you_want_to_delete_this_record')}
				variant='danger'
				confirmText={t('Yes')}
				cancelText={t('No')}
				onClose={(): void => setModal()}
				onCancel={(): void => setModal()}
				onConfirm={confirmRemove}
			/>,
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
};

export default InviteRow;
