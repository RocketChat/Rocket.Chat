import { ActionButton, Box, Icon, Option } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Breadcrumbs from '../../../components/Breadcrumbs';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { usePreventProgation } from '../../../hooks/usePreventProgation';
import RoomActions from './RoomActions';

export const useReactModal = (Component, props) => {
	const setModal = useSetModal();

	return useMutableCallback(() => {
		const handleClose = () => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} {...props} />);
	});
};

export const TeamChannelItem = ({ room, onClickView }) => {
	const t = useTranslation();
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const onClick = usePreventProgation();

	return (
		<Option id={room._id} data-rid={room._id} {...handleMenuEvent} onClick={onClickView}>
			<Option.Avatar>
				<RoomAvatar room={room} size='x28' />
			</Option.Avatar>
			<Option.Column>
				{room.t === 'c' ? <Icon name='hash' size='x15' /> : <Icon name='hashtag-lock' size='x15' />}
			</Option.Column>
			<Option.Content>
				<Box display='inline-flex'>
					{roomTypes.getRoomName(room.t, room)}{' '}
					{room.teamDefault ? <Breadcrumbs.Tag>{t('Team_Auto-join')}</Breadcrumbs.Tag> : ''}
				</Box>
			</Option.Content>
			<Option.Menu onClick={onClick}>
				{showButton ? <RoomActions room={room} /> : <ActionButton ghost tiny icon='kebab' />}
			</Option.Menu>
		</Option>
	);
};

TeamChannelItem.Skeleton = Option.Skeleton;
