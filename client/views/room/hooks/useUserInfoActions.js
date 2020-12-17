import React, { useCallback, useMemo } from 'react';
import { Button, ButtonGroup, Icon, Modal, Box } from '@rocket.chat/fuselage';
import { useAutoFocus, useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { usePermission, useAllPermissions } from '../../../contexts/AuthorizationContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useUserId, useUserSubscription, useUserSubscriptionByName } from '../../../contexts/UserContext';
import { useMethod } from '../../../contexts/ServerContext';
import { WebRTC } from '../../../../app/webrtc/client';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { RoomRoles } from '../../../../app/models/client';
import { roomTypes, RoomMemberActions } from '../../../../app/utils';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointAction';
import { useUserRoom } from './useUserRoom';
import { escapeHTML } from '../../../../lib/escapeHTML';


const useUserHasRoomRole = (uid, rid, role) => useReactiveValue(useCallback(() => !!RoomRoles.findOne({ rid, 'u._id': uid, roles: role }), [uid, rid, role]));

const getShouldOpenDirectMessage = (currentSubscription, usernameSubscription, canOpenDirectMessage, username) => {
	const canOpenDm = canOpenDirectMessage || usernameSubscription;
	const directMessageIsNotAlreadyOpen = currentSubscription && currentSubscription.name !== username;
	return canOpenDm && directMessageIsNotAlreadyOpen;
};

const getShouldAllowCalls = (webRTCInstance) => {
	if (!webRTCInstance) {
		return false;
	}

	const { localUrl, remoteItems } = webRTCInstance;
	const r = remoteItems.get() || [];
	if (localUrl.get() === null && r.length === 0) {
		return false;
	}

	return true;
};

const getUserIsMuted = (room, user, userCanPostReadonly) => {
	if (room && room.ro) {
		if (Array.isArray(room.unmuted) && room.unmuted.indexOf(user && user.username) !== -1) {
			return false;
		}

		if (userCanPostReadonly) {
			return Array.isArray(room.muted) && (room.muted.indexOf(user && user.username) !== -1);
		}

		return true;
	}

	return room && Array.isArray(room.muted) && room.muted.indexOf(user && user.username) > -1;
};

const WarningModal = ({ text, confirmText, close, confirm, ...props }) => {
	const refAutoFocus = useAutoFocus(true);
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='warning' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={close}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{text}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={close}>{t('Cancel')}</Button>
				<Button ref={refAutoFocus} primary danger onClick={confirm}>{confirmText}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};


const mapOptions = ([key, { action, label, icon }]) => [
	key,
	{
		label: { label, icon }, // TODO fuselage
		action,
	},
];

export const useUserInfoActionsSpread = (actions, size = 2) => useMemo(() => {
	const entries = Object.entries(actions);

	const options = entries.slice(0, size);
	const menuOptions = entries.slice(size, entries.length).map(mapOptions);
	const menu = menuOptions.length && Object.fromEntries(entries.slice(size, entries.length).map(mapOptions));

	return { actions: options, menu };
}, [actions, size]);

export const useUserInfoActions = (user = {}, rid) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const directRoute = useRoute('direct');

	const setModal = useSetModal();

	const { _id: uid } = user;
	const ownUserId = useUserId();

	const closeModal = useMutableCallback(() => setModal(null));

	const room = useUserRoom(rid);
	const currentSubscription = useUserSubscription(rid);
	const usernameSubscription = useUserSubscriptionByName(user.username);

	const isLeader = useUserHasRoomRole(uid, rid, 'leader');
	const isModerator = useUserHasRoomRole(uid, rid, 'moderator');
	const isOwner = useUserHasRoomRole(uid, rid, 'owner');

	const getWebRTCInstance = useCallback(() => WebRTC.getInstanceByRoomId(rid), [rid]);
	const webRTCInstance = useReactiveValue(getWebRTCInstance);

	const otherUserCanPostReadonly = useAllPermissions('post-readonly', rid);

	const isIgnored = currentSubscription && currentSubscription.ignored && currentSubscription.ignored.indexOf(uid) > -1;
	const isMuted = getUserIsMuted(room, user, otherUserCanPostReadonly);

	const endpointPrefix = room.t === 'p' ? 'groups' : 'channels';

	const roomConfig = room && room.t && roomTypes.getConfig(room.t);

	const [
		roomCanSetOwner,
		roomCanSetLeader,
		roomCanSetModerator,
		roomCanIgnore,
		roomCanBlock,
		roomCanMute,
		roomCanRemove,
	] = [
		...roomConfig && [
			roomConfig.allowMemberAction(room, RoomMemberActions.SET_AS_OWNER),
			roomConfig.allowMemberAction(room, RoomMemberActions.SET_AS_LEADER),
			roomConfig.allowMemberAction(room, RoomMemberActions.SET_AS_MODERATOR),
			roomConfig.allowMemberAction(room, RoomMemberActions.IGNORE),
			roomConfig.allowMemberAction(room, RoomMemberActions.BLOCK),
			roomConfig.allowMemberAction(room, RoomMemberActions.MUTE),
			roomConfig.allowMemberAction(room, RoomMemberActions.REMOVE_USER),
		],
	];

	const roomName = room && room.t && escapeHTML(roomTypes.getRoomName(room.t, room));

	const userCanSetOwner = usePermission('set-owner', rid);
	const userCanSetLeader = usePermission('set-leader', rid);
	const userCanSetModerator = usePermission('set-moderator', rid);
	const userCanMute = usePermission('mute-user', rid);
	const userCanRemove = usePermission('remove-user', rid);
	const userCanDirectMessage = usePermission('create-d');

	const shouldAllowCalls = getShouldAllowCalls(webRTCInstance);
	const callInProgress = useReactiveValue(useCallback(() => webRTCInstance?.callInProgress.get(), [webRTCInstance]));
	const shouldOpenDirectMessage = getShouldOpenDirectMessage(currentSubscription, usernameSubscription, userCanDirectMessage, user.username);

	const openDirectDm = useMutableCallback(() => directRoute.push({
		rid: user.username,
	}));

	const openDirectMessageOption = useMemo(() => shouldOpenDirectMessage && {
		label: t('Direct_Message'),
		icon: 'chat',
		action: openDirectDm,
	}, [openDirectDm, shouldOpenDirectMessage, t]);

	const videoCallOption = useMemo(() => {
		const joinCall = () => {
			webRTCInstance.joinCall({ audio: true, video: true });
		};
		const startCall = () => {
			webRTCInstance.startCall({ audio: true, video: true });
		};
		const action = callInProgress ? joinCall : startCall;

		return shouldAllowCalls && {
			label: t(callInProgress ? 'Join_video_call' : 'Start_video_call'),
			icon: 'video',
			action,
		};
	}, [callInProgress, shouldAllowCalls, t, webRTCInstance]);

	const audioCallOption = useMemo(() => {
		const joinCall = () => {
			webRTCInstance.joinCall({ audio: true, video: false });
		};
		const startCall = () => {
			webRTCInstance.startCall({ audio: true, video: false });
		};
		const action = callInProgress ? joinCall : startCall;

		return shouldAllowCalls && {
			label: t(callInProgress ? 'Join_audio_call' : 'Start_audio_call'),
			icon: 'mic',
			action,
		};
	}, [callInProgress, shouldAllowCalls, t, webRTCInstance]);

	const changeOwnerEndpoint = isOwner ? 'removeOwner' : 'addOwner';
	const changeOwnerMessage = isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_a_owner_of__room_name_';
	const changeOwner = useEndpointActionExperimental('POST', `${ endpointPrefix }.${ changeOwnerEndpoint }`, t(changeOwnerMessage, { username: user.username, room_name: roomName }));
	const changeOwnerAction = useMutableCallback(async () => changeOwner({ roomId: rid, userId: uid }));
	const changeOwnerOption = useMemo(() => roomCanSetOwner && userCanSetOwner && {
		label: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
		icon: 'shield-check',
		action: changeOwnerAction,
	}, [changeOwnerAction, isOwner, t, roomCanSetOwner, userCanSetOwner]);

	const changeLeaderEndpoint = isLeader ? 'removeLeader' : 'addLeader';
	const changeLeaderMessage = isLeader ? 'User__username__removed_from__room_name__leaders' : 'User__username__is_now_a_leader_of__room_name_';
	const changeLeader = useEndpointActionExperimental('POST', `${ endpointPrefix }.${ changeLeaderEndpoint }`, t(changeLeaderMessage, { username: user.username, room_name: roomName }));
	const changeLeaderAction = useMutableCallback(() => changeLeader({ roomId: rid, userId: uid }));
	const changeLeaderOption = useMemo(() => roomCanSetLeader && userCanSetLeader && {
		label: t(isLeader ? 'Remove_as_leader' : 'Set_as_leader'),
		icon: 'shield-alt',
		action: changeLeaderAction,
	}, [isLeader, roomCanSetLeader, t, userCanSetLeader, changeLeaderAction]);

	const changeModeratorEndpoint = isModerator ? 'removeModerator' : 'addModerator';
	const changeModeratorMessage = isModerator ? 'User__username__removed_from__room_name__moderators' : 'User__username__is_now_a_moderator_of__room_name_';
	const changeModerator = useEndpointActionExperimental('POST', `${ endpointPrefix }.${ changeModeratorEndpoint }`, t(changeModeratorMessage, { username: user.username, room_name: roomName }));
	const changeModeratorAction = useMutableCallback(() => changeModerator({ roomId: rid, userId: uid }));
	const changeModeratorOption = useMemo(() => roomCanSetModerator && userCanSetModerator && {
		label: t(isModerator ? 'Remove_as_moderator' : 'Set_as_moderator'),
		icon: 'shield',
		action: changeModeratorAction,
	}, [changeModeratorAction, isModerator, roomCanSetModerator, t, userCanSetModerator]);

	const ignoreUser = useMethod('ignoreUser');
	const ignoreUserAction = useMutableCallback(async () => {
		try {
			await ignoreUser({ rid, userId: uid, ignore: !isIgnored });
			dispatchToastMessage({ type: 'success', message: t('User_has_been_unignored') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});
	const ignoreUserOption = useMemo(() => roomCanIgnore && uid !== ownUserId && {
		label: t(isIgnored ? 'Unignore' : 'Ignore'),
		icon: 'ban',
		action: ignoreUserAction,
	}, [ignoreUserAction, isIgnored, ownUserId, roomCanIgnore, t, uid]);

	const isUserBlocked = currentSubscription.blocker;
	const toggleBlock = useMethod(isUserBlocked ? 'unblockUser' : 'blockUser');
	const toggleBlockUserAction = useMutableCallback(async () => {
		try {
			await toggleBlock({ rid, blocked: uid });
			dispatchToastMessage({ type: 'success', message: t(isUserBlocked ? 'User_is_unblocked' : 'User_is_blocked') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});
	const toggleBlockUserOption = useMemo(() => roomCanBlock && uid !== ownUserId && {
		label: t(isUserBlocked ? 'Unblock' : 'Block'),
		icon: 'ban',
		action: toggleBlockUserAction,
	}, [isUserBlocked, ownUserId, roomCanBlock, t, toggleBlockUserAction, uid]);

	const muteFn = useMethod(isMuted ? 'unmuteUserInRoom' : 'muteUserInRoom');
	const muteUserOption = useMemo(() => {
		const action = () => {
			const onConfirm = async () => {
				try {
					await muteFn({ rid, username: user.username });
					closeModal();
					dispatchToastMessage({
						type: 'success',
						message: t(
							isMuted
								? 'User__username__unmuted_in_room__roomName__'
								: 'User__username__muted_in_room__roomName__',
							{ username: user.username, roomName },
						),
					});
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			if (isMuted) {
				return onConfirm();
			}

			setModal(<WarningModal
				text={t('The_user_wont_be_able_to_type_in_s', roomName)}
				close={closeModal}
				confirmText={t('Yes_mute_user')}
				confirm={onConfirm}
			/>);
		};

		return roomCanMute && userCanMute && {
			label: t(isMuted ? 'Unmute_user' : 'Mute_user'),
			icon: isMuted ? 'mic' : 'mic-off',
			action,
		};
	}, [closeModal, dispatchToastMessage, isMuted, muteFn, rid, roomCanMute, roomName, setModal, t, user.username, userCanMute]);

	const removeUserAction = useEndpointActionExperimental('POST', `${ endpointPrefix }.kick`, t('User_has_been_removed_from_s', roomName));
	const removeUserOptionAction = useMutableCallback(() => {
		setModal(<WarningModal
			text={t('The_user_will_be_removed_from_s', roomName)}
			close={closeModal}
			confirmText={t('Yes_remove_user')}
			confirm={() => { removeUserAction({ roomId: rid, userId: uid }); closeModal(); }}
		/>);
	});
	const removeUserOption = useMemo(() => roomCanRemove && userCanRemove && {
		label: <Box color='danger'>{t('Remove_from_room')}</Box>,
		icon: 'sign-out',
		action: removeUserOptionAction,
	}, [roomCanRemove, userCanRemove, removeUserOptionAction, t]);

	return useMemo(() => ({
		...openDirectMessageOption && { openDirectMessage: openDirectMessageOption },
		...videoCallOption && { video: videoCallOption },
		...audioCallOption && { audio: audioCallOption },
		...changeOwnerOption && { changeOwner: changeOwnerOption },
		...changeLeaderOption && { changeLeader: changeLeaderOption },
		...changeModeratorOption && { changeModerator: changeModeratorOption },
		...ignoreUserOption && { ignoreUser: ignoreUserOption },
		...muteUserOption && { muteUser: muteUserOption },
		...removeUserOption && { removeUser: removeUserOption },
		...toggleBlockUserOption && { toggleBlock: toggleBlockUserOption },
	}),
	[
		audioCallOption,
		changeLeaderOption,
		changeModeratorOption,
		changeOwnerOption,
		ignoreUserOption,
		muteUserOption,
		openDirectMessageOption,
		removeUserOption,
		videoCallOption,
		toggleBlockUserOption,
	]);
};
