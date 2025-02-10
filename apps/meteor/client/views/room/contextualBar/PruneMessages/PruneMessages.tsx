import { Field, FieldLabel, FieldRow, ButtonGroup, Button, CheckBox, Callout } from '@rocket.chat/fuselage';
import { useId, type ReactElement } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PruneMessagesDateTimeRow from './PruneMessagesDateTimeRow';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarClose,
} from '../../../../components/Contextualbar';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';

type PruneMessagesProps = {
	callOutText?: string;
	validateText?: string;
	users: string[];
	onClickClose: () => void;
	onClickPrune: () => void;
};

const PruneMessages = ({ callOutText, validateText, onClickClose, onClickPrune }: PruneMessagesProps): ReactElement => {
	const { t } = useTranslation();
	const { control, register } = useFormContext();

	const inclusiveCheckboxId = useId();
	const pinnedCheckboxId = useId();
	const discussionCheckboxId = useId();
	const threadsCheckboxId = useId();
	const attachedCheckboxId = useId();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='eraser' />
				<ContextualbarTitle>{t('Prune_Messages')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<PruneMessagesDateTimeRow label={t('Newer_than')} field='newer' />
				<PruneMessagesDateTimeRow label={t('Older_than')} field='older' />
				<Field>
					<FieldLabel flexGrow={0}>{t('Only_from_users')}</FieldLabel>
					<Controller
						control={control}
						name='users'
						render={({ field: { onChange, value } }) => (
							<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Please_enter_usernames')} />
						)}
					/>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={inclusiveCheckboxId}>{t('Inclusive')}</FieldLabel>
						<CheckBox id={inclusiveCheckboxId} {...register('inclusive')} />
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={pinnedCheckboxId}>{t('RetentionPolicy_DoNotPrunePinned')}</FieldLabel>
						<CheckBox id={pinnedCheckboxId} {...register('pinned')} />
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={discussionCheckboxId}>{t('RetentionPolicy_DoNotPruneDiscussion')}</FieldLabel>
						<CheckBox id={discussionCheckboxId} {...register('discussion')} />
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={threadsCheckboxId}>{t('RetentionPolicy_DoNotPruneThreads')}</FieldLabel>
						<CheckBox id={threadsCheckboxId} {...register('threads')} />
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={attachedCheckboxId}>{t('Files_only')}</FieldLabel>
						<CheckBox id={attachedCheckboxId} {...register('attached')} />
					</FieldRow>
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
