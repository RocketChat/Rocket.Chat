import { Field, ButtonGroup, Button, CheckBox, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
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

type PruneMessagesProps = {
	callOutText?: string;
	validateText?: string;
	users: string[];
	onClickClose: () => void;
	onClickPrune: () => void;
};

const PruneMessages = ({ callOutText, validateText, onClickClose, onClickPrune }: PruneMessagesProps): ReactElement => {
	const t = useTranslation();
	const { control, register } = useFormContext();

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
				<PruneMessagesDateTimeRow label={t('Newer_than')} field='newer' />
				<PruneMessagesDateTimeRow label={t('Older_than')} field='older' />
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
						<CheckBox id={inclusiveCheckboxId} {...register('inclusive')} />
						<Field.Label htmlFor={inclusiveCheckboxId}>{t('Inclusive')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={pinnedCheckboxId} {...register('pinned')} />
						<Field.Label htmlFor={pinnedCheckboxId}>{t('RetentionPolicy_DoNotPrunePinned')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={discussionCheckboxId} {...register('discussion')} />
						<Field.Label htmlFor={discussionCheckboxId}>{t('RetentionPolicy_DoNotPruneDiscussion')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={threadsCheckboxId} {...register('threads')} />
						<Field.Label htmlFor={threadsCheckboxId}>{t('RetentionPolicy_DoNotPruneThreads')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={attachedCheckboxId} {...register('attached')} />
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
