import type { IRoom } from '@rocket.chat/core-typings';
import { IconButton, MessageMetricsItem } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useLeaveRoomAction } from '../../../hooks/menuActions/useLeaveRoom';

export type DiscussionMetricsMembershipProps = {
	drid: IRoom['_id'];
};

const DiscussionMetricsMembership = ({ drid }: DiscussionMetricsMembershipProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const subscription = useUserSubscription(drid);
	const room = useUserRoom(drid);
	const isMember = !!subscription;

	const joinRoom = useEndpoint('POST', '/v1/rooms.join');
	const join = useMutation({
		mutationFn: () => joinRoom({ roomId: drid }),
		onError: (error: unknown) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const leave = useLeaveRoomAction({
		rid: drid,
		type: room?.t ?? 'c',
		name: room?.fname ?? room?.name ?? '',
	});

	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isMember) {
			leave();
			return;
		}

		join.mutate();
	};

	return (
		<MessageMetricsItem data-drid={drid}>
			<IconButton
				small
				icon={isMember ? 'sign-out' : 'login'}
				title={isMember ? t('Leave') : t('Join')}
				aria-label={isMember ? t('Leave') : t('Join')}
				disabled={join.isPending}
				onClick={handleClick}
			/>
		</MessageMetricsItem>
	);
};

export default DiscussionMetricsMembership;
