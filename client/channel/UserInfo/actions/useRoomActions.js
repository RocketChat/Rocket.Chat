import React, { useCallback, useMemo } from 'react';
import { Button, ButtonGroup, Icon, Modal, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { usePermission, useUserHasAllPermissions } from '../../../contexts/AuthorizationContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useUserId } from '../../../contexts/UserContext';
import { useSession } from '../../../contexts/SessionContext';
import { useMethod } from '../../../contexts/ServerContext';
import { WebRTC } from '../../../../app/webrtc/client';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { ChatRoom, RoomRoles, Subscriptions } from '../../../../app/models/client';
import { roomTypes, RoomMemberActions } from '../../../../app/utils';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointAction';

const userHasRoomRole = (uid, rid, role) => !!RoomRoles.findOne({ rid, 'u._id': uid, roles: role });

const getShouldOpenDirectMessage = (thisSubscription, usernameSubscription, canOpenDirectMessage, username) => {
	const canOpenDm = canOpenDirectMessage || usernameSubscription;
	const directMessageIsNotAlreadyOpen = thisSubscription && thisSubscription.name !== username;
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
				<Button primary danger onClick={confirm}>{confirmText}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export const useRoomActions = (user) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const directRoute = useRoute('direct');

	const setModal = useSetModal();

	const rid = useSession('openedRoom');

	const { _id: userId } = user;
	const ownUserId = useUserId();

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const getThisSubscription = useCallback(() => Subscriptions.findOne({ rid }), [rid]);
	const getWebRTCInstance = useCallback(() => WebRTC.getInstanceByRoomId(rid), [rid]);
	const getUsernameSubscription = useCallback(() => Subscriptions.findOne({ name: user.username }), [user.username]);
	const getRoom = useCallback(() => ChatRoom.findOne(rid), [rid]);

	const isLeader = useReactiveValue(() => userHasRoomRole(userId, rid, 'leader'), [userId, rid]);
	const isModerator = useReactiveValue(() => userHasRoomRole(userId, rid, 'moderator'), [userId, rid]);
	const isOwner = useReactiveValue(() => userHasRoomRole(userId, rid, 'owner'), [userId, rid]);

	const room = useReactiveValue(getRoom);
	const thisSubscription = useReactiveValue(getThisSubscription);
	const usernameSubscription = useReactiveValue(getUsernameSubscription);
	const webRTCInstance = useReactiveValue(getWebRTCInstance);

	const otherUserCanPostReadonly = useUserHasAllPermissions('post-readonly', rid, userId);

	const isIgnored = thisSubscription && thisSubscription.ignored && thisSubscription.ignored.indexOf(userId) > -1;
	const isMuted = getUserIsMuted(room, user, otherUserCanPostReadonly);

	const endpointPrefix = room.t === 'p' ? 'groups' : 'channels';

	const roomConfig = room && room.t && roomTypes.getConfig(room.t);

	const roomAllowedActions = (roomConfig && {
		roomCanSetOwner: roomConfig.allowMemberAction(room, RoomMemberActions.SET_AS_OWNER),
		roomCanSetLeader: roomConfig.allowMemberAction(room, RoomMemberActions.SET_AS_LEADER),
		roomCanSetModerator: roomConfig.allowMemberAction(room, RoomMemberActions.SET_AS_MODERATOR),
		roomCanBlock: roomConfig.allowMemberAction(room, RoomMemberActions.IGNORE),
		roomCanMute: roomConfig.allowMemberAction(room, RoomMemberActions.MUTE),
		roomCanRemove: roomConfig.allowMemberAction(room, RoomMemberActions.REMOVE_USER),
	}) || {};

	const {
		roomCanSetOwner,
		roomCanSetLeader,
		roomCanSetModerator,
		roomCanBlock,
		roomCanMute,
		roomCanRemove,
	} = roomAllowedActions;

	const roomName = room && room.t && roomTypes.getRoomName(room.t, room);

	const userCanSetOwner = usePermission('set-owner', rid);
	const userCanSetLeader = usePermission('set-leader', rid);
	const userCanSetModerator = usePermission('set-moderator', rid);
	const userCanMute = usePermission('mute-user', rid);
	const userCanRemove = usePermission('remove-user', rid);
	const userCanDirectMessage = usePermission('create-d');

	const shouldAllowCalls = getShouldAllowCalls(webRTCInstance);
	const callInProgress = useReactiveValue(() => webRTCInstance?.callInProgress?.get());
	const shouldOpenDirectMessage = getShouldOpenDirectMessage(thisSubscription, usernameSubscription, userCanDirectMessage, user.username);

	const openDirectMessageOption = useMemo(() => {
		const action = () => directRoute.push({
			rid: user.username,
		});

		return shouldOpenDirectMessage && {
			label: t('Direct_Message'),
			icon: (props) => <Icon name='chat' size='x20' mie='x4' {...props}/>,
			action,
		};
	}, [directRoute, shouldOpenDirectMessage, t, user.username]);

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
			icon: (props) => <Icon name='video' size='x20' mie='x4' {...props}/>,
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
			icon: (props) => <Icon name='mic' size='x20' mie='x4' {...props}/>,
			action,
		};
	}, [callInProgress, shouldAllowCalls, t, webRTCInstance]);

	const changeOwnerEndpoint = isOwner ? 'removeOwner' : 'addOwner';
	const changeOwnerMessage = isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_a_owner_of__room_name_';
	const changeOwnerAction = useEndpointActionExperimental('POST', `${ endpointPrefix }.${ changeOwnerEndpoint }`, t(changeOwnerMessage, { username: user.username, room_name: roomName }));
	const changeOwner = useCallback(async () => {
		await changeOwnerAction({ roomId: rid, userId });
	}, [changeOwnerAction, rid, userId]);

	const changeOwnerOption = useMemo(() => roomCanSetOwner && userCanSetOwner && {
		label: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
		icon: (props) => <Icon name='shield-check' size='x20' mie='x4' {...props}/>,
		action: changeOwner,
	}, [changeOwner, isOwner, roomCanSetOwner, t, userCanSetOwner]);

	const changeLeaderEndpoint = isLeader ? 'removeLeader' : 'addLeader';
	const changeLeaderMessage = isLeader ? 'User__username__removed_from__room_name__leaders' : 'User__username__is_now_a_leader_of__room_name_';
	const changeLeaderAction = useEndpointActionExperimental('POST', `${ endpointPrefix }.${ changeLeaderEndpoint }`, t(changeLeaderMessage, { username: user.username, room_name: roomName }));
	const changeLeader = useCallback(async () => {
		await changeLeaderAction({ roomId: rid, userId });
	}, [changeLeaderAction, rid, userId]);

	const changeLeaderOption = useMemo(() => roomCanSetLeader && userCanSetLeader && {
		label: t(isLeader ? 'Remove_as_leader' : 'Set_as_leader'),
		icon: (props) => <Icon name='shield-alt' size='x20' mie='x4' {...props}/>,
		action: changeLeader,
	}, [changeLeader, isLeader, roomCanSetLeader, t, userCanSetLeader]);

	const changeModeratorEndpoint = isModerator ? 'removeModerator' : 'addModerator';
	const changeModeratorMessage = isModerator ? 'User__username__removed_from__room_name__moderators' : 'User__username__is_now_a_moderator_of__room_name_';
	const changeModeratorAction = useEndpointActionExperimental('POST', `${ endpointPrefix }.${ changeModeratorEndpoint }`, t(changeModeratorMessage, { username: user.username, room_name: roomName }));
	const changeModerator = useCallback(async () => {
		await changeModeratorAction({ roomId: rid, userId });
	}, [changeModeratorAction, rid, userId]);

	const changeModeratorOption = useMemo(() => roomCanSetModerator && userCanSetModerator && {
		label: t(isModerator ? 'Remove_as_moderator' : 'Set_as_moderator'),
		icon: (props) => <Icon name='shield' size='x20' mie='x4'{...props}/>,
		action: changeModerator,
	}, [changeModerator, isModerator, roomCanSetModerator, t, userCanSetModerator]);

	const ignoreUserFn = useMethod('ignoreUser');
	const ignoreUser = useCallback(async () => {
		try {
			await ignoreUserFn({ rid, ignoredUser: userId, ignore: !isIgnored });
			dispatchToastMessage({ type: 'success', message: t('User_has_been_unignored') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, ignoreUserFn, isIgnored, rid, t, userId]);
	const ignoreUserOption = useMemo(() => roomCanBlock && userId !== ownUserId && {
		label: t(isIgnored ? 'Unignore' : 'Ignore'),
		icon: (props) => <Icon name='ban' size='x20' mie='x4'{...props}/>,
		action: ignoreUser,
	}, [ignoreUser, isIgnored, ownUserId, roomCanBlock, t, userId]);

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
			icon: (props) => <Icon name={isMuted ? 'mic' : 'mic-off'} size='x20' mie='x4'{...props}/>,
			action,
		};
	}, [closeModal, dispatchToastMessage, isMuted, muteFn, rid, roomCanMute, roomName, setModal, t, user.username, userCanMute]);

	const removeUserAction = useEndpointActionExperimental('POST', `${ endpointPrefix }.kick`, t('User_has_been_removed_from_s', roomName));
	const removeUserOption = useMemo(() => {
		const action = () => {
			setModal(<WarningModal
				text={t('The_user_will_be_removed_from_s', roomName)}
				close={closeModal}
				confirmText={t('Yes_remove_user')}
				confirm={() => { removeUserAction({ roomId: rid, userId }); closeModal(); }}
			/>);
		};

		return roomCanRemove && userCanRemove && {
			label: <Box color='danger'>{t('Remove_from_room')}</Box>,
			icon: (props) => <Icon name='sign-out' size='x20' mie='x4' color='danger'{...props}/>,
			action,
		};
	}, [closeModal, removeUserAction, rid, roomCanRemove, roomName, setModal, t, userCanRemove, userId]);

	return useMemo(() => {
		const options = {
			openDirectMessage: openDirectMessageOption,
			video: videoCallOption,
			audio: audioCallOption,
			changeOwner: changeOwnerOption,
			changeLeader: changeLeaderOption,
			changeModerator: changeModeratorOption,
			ignoreUser: ignoreUserOption,
			muteUser: muteUserOption,
			removeUser: removeUserOption,
		};

		return Object.keys(options).reduce((acc, key) => {
			if (options[key]) {
				Object.assign(acc, { [key]: options[key] });
			}
			return acc;
		}, {});
	}, [
		audioCallOption,
		changeLeaderOption,
		changeModeratorOption,
		changeOwnerOption,
		ignoreUserOption,
		muteUserOption,
		openDirectMessageOption,
		removeUserOption,
		videoCallOption,
	]);
};
