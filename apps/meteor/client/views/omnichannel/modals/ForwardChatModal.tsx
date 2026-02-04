import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Field, FieldGroup, TextAreaInput, Box, Divider, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import AutoCompleteAgent from '../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../components/AutoCompleteDepartment';

type ForwardChatModalFormData = {
	comment: string;
	department: string;
	username: string;
};

type ForwardChatModalProps = {
	room: IOmnichannelRoom;
	onCancel: () => void;
};

const ForwardChatModal = ({ room, onCancel }: ForwardChatModalProps): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const getUserData = useEndpoint('GET', '/v1/users.info');
	const idleAgentsAllowedForForwarding = useSetting('Livechat_enabled_when_agent_idle', true);

	const departmentFieldId = useId();
	const userFieldId = useId();
	const commentFieldId = useId();

	const {
		handleSubmit,
		setFocus,
		control,
		watch,
		formState: { isSubmitting },
	} = useForm<ForwardChatModalFormData>();

	useEffect(() => {
		setFocus('department');
	}, [setFocus]);

	const department = watch('department');
	const username = watch('username');

	const forwardChat = useEndpoint('POST', '/v1/livechat/room.forward');

	const handleForwardChat = useCallback(
		async ({ department: departmentId, username, comment }: ForwardChatModalFormData) => {
			try {
				let userId;

				if (username) {
					const { user } = await getUserData({ username });
					userId = user?._id;
				}

				if (departmentId && userId) {
					return;
				}

				const payload: {
					roomId: string;
					departmentId?: string;
					userId?: string;
					comment?: string;
					clientAction: boolean;
				} = {
					roomId: room._id,
					comment,
					clientAction: true,
				};

				if (departmentId) {
					payload.departmentId = departmentId;
				}

				if (userId) {
					payload.userId = userId;
				}

				await forwardChat(payload);
				dispatchToastMessage({ type: 'success', message: t('Transferred') });
				router.navigate('/home');
				LegacyRoomManager.close(room.t + room._id);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				onCancel();
			}
		},
		[room._id, room.t, getUserData, forwardChat, dispatchToastMessage, t, router, onCancel],
	);

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Forward_chat')}
			onCancel={onCancel}
			onConfirm={handleSubmit(handleForwardChat)}
			confirmText={t('Forward')}
			confirmDisabled={!username && !department}
			confirmLoading={isSubmitting}
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={departmentFieldId}>{t('Forward_to_department')}</FieldLabel>
					<FieldRow>
						<Controller
							name='department'
							control={control}
							render={({ field: { ref: _ref, ...field } }) => (
								<AutoCompleteDepartment
									{...field}
									id={departmentFieldId}
									aria-label={t('Forward_to_department')}
									withTitle={false}
									maxWidth='100%'
									flexGrow={1}
									disabled={!!username}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Divider p={0}>{t('or')}</Divider>
				<Field>
					<FieldLabel htmlFor={userFieldId}>{t('Forward_to_user')}</FieldLabel>
					<FieldRow>
						<Controller
							name='username'
							control={control}
							render={({ field: { ref: _ref, ...field } }) => (
								<AutoCompleteAgent
									id={userFieldId}
									{...field}
									aria-label={t('Forward_to_user')}
									withTitle
									onlyAvailable
									excludeId={room.servedBy?._id}
									showIdleAgents={idleAgentsAllowedForForwarding}
									placeholder={t('Username_name_email')}
									disabled={!!department}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field marginBlock={15}>
					<FieldLabel htmlFor={commentFieldId}>
						{t('Leave_a_comment')}
						<Box mis={4} is='span' color='annotation'>
							({t('Optional')})
						</Box>
					</FieldLabel>
					<FieldRow>
						<Controller
							name='comment'
							control={control}
							render={({ field }) => <TextAreaInput {...field} id={commentFieldId} rows={8} flexGrow={1} />}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ForwardChatModal;
