import type { SelectOption } from '@rocket.chat/fuselage';
import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, CheckBox, Select } from '@rocket.chat/fuselage-forms';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarClose,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { FormEvent } from 'react';
import { useId, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PruneMessagesDateTimeRow from './PruneMessagesDateTimeRow';
import type { PruneMessagesFormValues } from './PruneMessagesWithData';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';

export type PruneMessagesProps = {
	validateDateRange: (values: PruneMessagesFormValues) => string | true;
	onClickClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const PruneMessages = ({ validateDateRange, onClickClose, onSubmit }: PruneMessagesProps) => {
	const { t } = useTranslation();
	const { control, watch } = useFormContext<PruneMessagesFormValues>();

	const formId = useId();

	const [content, deleteDiscussion] = watch(['content', 'deleteDiscussion']);

	const contentOptions = useMemo<SelectOption[]>(
		() => [
			['messages', t('Messages_and_files')],
			['files', t('Only_files')],
		],
		[t],
	);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='trash' />
				<ContextualbarTitle>{t('Bulk_delete')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<form id={formId} onSubmit={onSubmit}>
					<FieldGroup>
						<Field>
							<FieldLabel>{t('Delete')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='content'
									render={({ field: { value, onChange } }) => <Select options={contentOptions} value={value} onChange={onChange} />}
								/>
							</FieldRow>
						</Field>
						<PruneMessagesDateTimeRow label={t('From')} field='newer' />
						<PruneMessagesDateTimeRow label={t('Until')} field='older' validate={validateDateRange} />
						<Field>
							<FieldLabel>{t('Only_delete_if_sent_by')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='users'
									render={({ field: { onChange, value } }) => (
										<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Enter_usernames')} />
									)}
								/>
							</FieldRow>
							<FieldHint>{t('Leave_empty_to_apply_to_all_users')}</FieldHint>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel>{t('Delete_pinned_messages_and_files')}</FieldLabel>
								<Controller
									control={control}
									name='deletePinned'
									render={({ field: { value, ...field } }) => <CheckBox {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel>{t('Delete_thread_messages_and_files')}</FieldLabel>
								<Controller
									control={control}
									name='deleteThreads'
									render={({ field: { value, ...field } }) => <CheckBox {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel>{t('Delete_discussion_messages_and_files')}</FieldLabel>
								<Controller
									control={control}
									name='deleteDiscussion'
									render={({ field: { value, ...field } }) => <CheckBox {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel>{t('RetentionPolicy_DeleteDiscussionOrigin')}</FieldLabel>
								<Controller
									control={control}
									name='deleteDiscussionOrigin'
									render={({ field: { value, ...field } }) => (
										<CheckBox {...field} checked={deleteDiscussion || value} disabled={deleteDiscussion} />
									)}
								/>
							</FieldRow>
							<FieldHint>{t('RetentionPolicy_DeleteDiscussionOrigin_Description')}</FieldHint>
						</Field>
					</FieldGroup>
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button variant='danger' type='submit' form={formId}>
						{content === 'files' ? t('Delete_files') : t('Delete_messages_and_files')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default PruneMessages;
