import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Field, FieldGroup, TextAreaInput, Box, Divider, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../components/AutoCompleteDepartment';
import type { ForwardChatInput } from '../lib/forwardChat';
import { getForwardChatFieldStates } from '../lib/forwardChat';

type ForwardChatModalFormData = {
	comment: string;
	department: string;
	username: string;
};

export type ForwardChatModalProps = {
	room: IOmnichannelRoom;
	showIdleAgents: boolean;
	onForward: (input: ForwardChatInput) => Promise<void> | void;
	onCancel: () => void;
};

const ForwardChatModal = ({ room, showIdleAgents, onForward, onCancel }: ForwardChatModalProps) => {
	const { t } = useTranslation();

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

	const { canPickDepartment, canPickAgent, canForward } = getForwardChatFieldStates({ department, username });

	const handleForwardChat = async (input: ForwardChatModalFormData) => {
		await onForward(input);
		onCancel();
	};

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Forward_chat')}
			onCancel={onCancel}
			onConfirm={handleSubmit(handleForwardChat)}
			confirmText={t('Forward')}
			confirmDisabled={!canForward}
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
									disabled={!canPickDepartment}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Divider padding={0}>{t('or')}</Divider>
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
									showIdleAgents={showIdleAgents}
									placeholder={t('Username_name_email')}
									disabled={!canPickAgent}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field marginBlock={15}>
					<FieldLabel htmlFor={commentFieldId}>
						{t('Leave_a_comment')}
						<Box marginInlineStart={4} is='span' color='annotation'>
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
