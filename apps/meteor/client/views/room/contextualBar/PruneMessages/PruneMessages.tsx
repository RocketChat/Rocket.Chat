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
	ContextualbarDialog,
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
	const { control } = useFormContext();

	const inclusiveCheckboxId = useId();
	const pinnedCheckboxId = useId();
	const discussionCheckboxId = useId();
	const threadsCheckboxId = useId();
	const attachedCheckboxId = useId();

	return (
		<ContextualbarDialog>
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
						<Controller
							control={control}
							name='inclusive'
							render={({ field: { value, ...field } }) => <CheckBox id={inclusiveCheckboxId} {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={pinnedCheckboxId}>{t('RetentionPolicy_DoNotPrunePinned')}</FieldLabel>
						<Controller
							control={control}
							name='pinned'
							render={({ field: { value, ...field } }) => <CheckBox id={pinnedCheckboxId} {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={discussionCheckboxId}>{t('RetentionPolicy_DoNotPruneDiscussion')}</FieldLabel>
						<Controller
							control={control}
							name='discussion'
							render={({ field: { value, ...field } }) => <CheckBox id={discussionCheckboxId} {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={threadsCheckboxId}>{t('RetentionPolicy_DoNotPruneThreads')}</FieldLabel>
						<Controller
							control={control}
							name='threads'
							render={({ field: { value, ...field } }) => <CheckBox id={threadsCheckboxId} {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={attachedCheckboxId}>{t('Files_only')}</FieldLabel>
						<Controller
							control={control}
							name='attached'
							render={({ field: { value, ...field } }) => <CheckBox id={attachedCheckboxId} {...field} checked={value} />}
						/>
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
		</ContextualbarDialog>
	);
};

export default PruneMessages;
