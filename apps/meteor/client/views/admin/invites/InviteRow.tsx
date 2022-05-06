import type { IInvite } from '@rocket.chat/core-typings';
import { Button, Icon, Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, MouseEvent } from 'react';

import { GenericTableCell, GenericTableRow } from '../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useTimeFromNow } from '../../../hooks/useTimeFromNow';

const isExpired = (expires: IInvite['expires']): boolean => {
	if (expires && expires.getTime() < new Date().getTime()) {
		return true;
	}

	return false;
};

type InviteRowProps = Omit<IInvite, 'createdAt' | 'expires' | '_updatedAt'> & {
	onRemove: (removeInvite: () => void) => void;
	_updatedAt: string;
	createdAt: string;
	expires: string | null;
};

const InviteRow = ({ _id, createdAt, expires, uses, maxUses, onRemove }: InviteRowProps): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const removeInvite = useEndpoint('DELETE', `removeInvite/${_id}`);

	const getTimeFromNow = useTimeFromNow(false);

	const daysToExpire = (expires: IInvite['expires']): string => {
		if (expires) {
			if (isExpired(expires)) {
				return t('Expired');
			}

			return getTimeFromNow(expires);
		}

		return t('Never');
	};

	const maxUsesLeft = (maxUses: IInvite['maxUses'], uses: IInvite['uses']): number | string => {
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
		onRemove(removeInvite);
	};

	const notSmall = useMediaQuery('(min-width: 768px)');

	return (
		<GenericTableRow>
			<GenericTableCell>
				<Box color='hint' fontScale='p2'>
					{_id}
				</Box>
			</GenericTableCell>
			{notSmall && (
				<>
					<GenericTableCell>{formatDateAndTime(new Date(createdAt))}</GenericTableCell>
					<GenericTableCell>{daysToExpire(expires ? new Date(expires) : null)}</GenericTableCell>
					<GenericTableCell>{uses}</GenericTableCell>
					<GenericTableCell>{maxUsesLeft(maxUses, uses)}</GenericTableCell>
				</>
			)}
			<GenericTableCell>
				<Button ghost danger small square onClick={handleRemoveButtonClick}>
					<Icon name='cross' size='x20' />
				</Button>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default InviteRow;
