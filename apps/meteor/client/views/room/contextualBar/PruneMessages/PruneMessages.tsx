import { Field, ButtonGroup, Button, CheckBox, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarClose,
} from '../../../../components/Contextualbar';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import PruneMessagesDateTimeRow from './PruneMessagesDateTimeRow';
import type { initialValues } from './PruneMessagesWithData';

type PruneMessagesProps = {
	callOutText?: string;
	validateText?: string;
	users: string[];
	onClickClose: () => void;
	onClickPrune: () => void;
};

const PruneMessages = ({ callOutText, validateText, onClickClose, onClickPrune }: PruneMessagesProps): ReactElement => {
	const t = useTranslation();
	const { watch, setValue, control } = useFormContext();
	const { newerDate, newerTime, olderDate, olderTime } = watch() as typeof initialValues;

	const handleFieldValues = useCallback((field) => (e: any) => setValue(field, e.target.value), [setValue]);

	const handleNewerDate = handleFieldValues('newerDate');
	const handleNewerTime = handleFieldValues('newerTime');
	const handleOlderDate = handleFieldValues('olderDate');
	const handleOlderTime = handleFieldValues('olderTime');

	const inclusiveCheckboxId = useUniqueId();
	const pinnedCheckboxId = useUniqueId();
	const discussionCheckboxId = useUniqueId();
	const threadsCheckboxId = useUniqueId();
	const attachedCheckboxId = useUniqueId();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='eraser' />
				<ContextualbarTitle>{t('Prune_Messages')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<PruneMessagesDateTimeRow
					label={t('Newer_than')}
					dateTime={{ date: newerDate, time: newerTime }}
					handleDateTime={{ date: handleNewerDate, time: handleNewerTime }}
				/>
				<PruneMessagesDateTimeRow
					label={t('Older_than')}
					dateTime={{ date: olderDate, time: olderTime }}
					handleDateTime={{ date: handleOlderDate, time: handleOlderTime }}
				/>
				<Field>
					<Field.Label flexGrow={0}>{t('Only_from_users')}</Field.Label>
					<Controller
						control={control}
						name='users'
						render={({ field: { onChange, value } }) => (
							<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Please_enter_usernames')} />
						)}
					/>
				</Field>
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='inclusive'
							render={({ field: { onChange, value } }) => <CheckBox id={inclusiveCheckboxId} checked={value} onChange={onChange} />}
						/>
						<Field.Label htmlFor={inclusiveCheckboxId}>{t('Inclusive')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='pinned'
							render={({ field: { onChange, value } }) => <CheckBox id={pinnedCheckboxId} checked={value} onChange={onChange} />}
						/>
						<Field.Label htmlFor={pinnedCheckboxId}>{t('RetentionPolicy_DoNotPrunePinned')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='discussion'
							render={({ field: { onChange, value } }) => <CheckBox id={discussionCheckboxId} checked={value} onChange={onChange} />}
						/>
						<Field.Label htmlFor={discussionCheckboxId}>{t('RetentionPolicy_DoNotPruneDiscussion')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='threads'
							render={({ field: { onChange, value } }) => <CheckBox id={threadsCheckboxId} checked={value} onChange={onChange} />}
						/>
						<Field.Label htmlFor={threadsCheckboxId}>{t('RetentionPolicy_DoNotPruneThreads')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='attached'
							render={({ field: { onChange, value } }) => <CheckBox id={attachedCheckboxId} checked={value} onChange={onChange} />}
						/>
						<Field.Label htmlFor={attachedCheckboxId}>{t('Files_only')}</Field.Label>
					</Field.Row>
				</Field>
				{callOutText && !validateText && <Callout type='warning'>{callOutText}</Callout>}
				{validateText && <Callout type='warning'>{validateText}</Callout>}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button danger disabled={Boolean(validateText)} onClick={onClickPrune}>
						{t('Prune')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default PruneMessages;
