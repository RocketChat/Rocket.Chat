import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Field, FieldGroup, Button, TextAreaInput, Modal, Box, Divider, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../AutoCompleteAgent';
import AutoCompleteDepartment from '../../AutoCompleteDepartment';

type ForwardChatModalFormData = {
	comment: string;
	department: string;
	username: string;
};

type ForwardChatModalProps = {
	onForward: (departmentId?: string, userId?: string, comment?: string) => Promise<void>;
	onCancel: () => void;
	room: IOmnichannelRoom;
};

const ForwardChatModal = ({ onForward, onCancel, room, ...props }: ForwardChatModalProps): ReactElement => {
	const { t } = useTranslation();
	const getUserData = useEndpoint('GET', '/v1/users.info');
	const idleAgentsAllowedForForwarding = useSetting('Livechat_enabled_when_agent_idle', true);

	const {
		getValues,
		handleSubmit,
		register,
		setFocus,
		setValue,
		watch,
		formState: { isSubmitting },
	} = useForm<ForwardChatModalFormData>();

	useEffect(() => {
		setFocus('comment');
	}, [setFocus]);

	const department = watch('department');
	const username = watch('username');

	const onSubmit = useCallback(
		async ({ department: departmentId, username, comment }: ForwardChatModalFormData) => {
			let uid;

			if (username) {
				const { user } = await getUserData({ username });
				uid = user?._id;
			}

			await onForward(departmentId, uid, comment);
		},
		[getUserData, onForward],
	);

	useEffect(() => {
		register('department');
		register('username');
	}, [register]);

	return (
		<Modal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(onSubmit)} {...props} />}
			{...props}
			data-qa-id='forward-chat-modal'
		>
			<Modal.Header>
				<Modal.Icon name='baloon-arrow-top-right' />
				<Modal.Title>{t('Forward_chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Forward_to_department')}</FieldLabel>
						<FieldRow>
							<AutoCompleteDepartment
								withTitle={false}
								maxWidth='100%'
								flexGrow={1}
								data-qa-id='forward-to-department'
								onChange={(value: string): void => {
									setValue('department', value);
								}}
							/>
						</FieldRow>
					</Field>
					<Divider p={0} children={t('or')} />
					<Field>
						<FieldLabel>{t('Forward_to_user')}</FieldLabel>
						<FieldRow>
							<AutoCompleteAgent
								withTitle
								onlyAvailable
								value={getValues().username}
								excludeId={room.servedBy?._id}
								showIdleAgents={idleAgentsAllowedForForwarding}
								placeholder={t('Username_name_email')}
								onChange={(value) => {
									setValue('username', value);
								}}
							/>
						</FieldRow>
					</Field>
					<Field marginBlock={15}>
						<FieldLabel>
							{t('Leave_a_comment')}{' '}
							<Box is='span' color='annotation'>
								({t('Optional')})
							</Box>
						</FieldLabel>
						<FieldRow>
							<TextAreaInput data-qa-id='ForwardChatModalTextAreaInputComment' {...register('comment')} rows={8} flexGrow={1} />
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button type='submit' disabled={!username && !department} primary loading={isSubmitting}>
						{t('Forward')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ForwardChatModal;
