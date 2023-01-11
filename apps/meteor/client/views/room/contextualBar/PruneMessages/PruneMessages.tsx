import type { IUser } from '@rocket.chat/core-typings';
import { Field, ButtonGroup, Button, CheckBox, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import VerticalBar from '../../../../components/VerticalBar';
import PruneMessagesDateTimeRow from './PruneMessagesDateTimeRow';
import type { initialValues } from './PruneMessagesWithData';

type PruneMessagesProps = {
	callOutText?: string;
	validateText?: string;
	users: IUser['username'][];
	values: Record<string, unknown>;
	handlers: Record<string, (eventOrValue: unknown) => void>;
	onClickClose: () => void;
	onClickPrune: () => void;
	onChangeUsers: (value: IUser['username'], action?: string) => void;
};

const PruneMessages = ({
	callOutText,
	validateText,
	values,
	handlers,
	onClickClose,
	onClickPrune,
	onChangeUsers,
}: PruneMessagesProps): ReactElement => {
	const t = useTranslation();

	const { newerDate, newerTime, olderDate, olderTime, users, inclusive, pinned, discussion, threads, attached } =
		values as typeof initialValues;

	const {
		handleNewerDate,
		handleNewerTime,
		handleOlderDate,
		handleOlderTime,
		handleInclusive,
		handlePinned,
		handleDiscussion,
		handleThreads,
		handleAttached,
	} = handlers;

	const inclusiveCheckboxId = useUniqueId();
	const pinnedCheckboxId = useUniqueId();
	const discussionCheckboxId = useUniqueId();
	const threadsCheckboxId = useUniqueId();
	const attachedCheckboxId = useUniqueId();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='eraser' />
				<VerticalBar.Text>{t('Prune_Messages')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
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
					<UserAutoCompleteMultiple value={users} onChange={onChangeUsers} placeholder={t('Please_enter_usernames')} />
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={inclusiveCheckboxId} checked={inclusive} onChange={handleInclusive} />
						<Field.Label htmlFor={inclusiveCheckboxId}>{t('Inclusive')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={pinnedCheckboxId} checked={pinned} onChange={handlePinned} />
						<Field.Label htmlFor={pinnedCheckboxId}>{t('RetentionPolicy_DoNotPrunePinned')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={discussionCheckboxId} checked={discussion} onChange={handleDiscussion} />
						<Field.Label htmlFor={discussionCheckboxId}>{t('RetentionPolicy_DoNotPruneDiscussion')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={threadsCheckboxId} checked={threads} onChange={handleThreads} />
						<Field.Label htmlFor={threadsCheckboxId}>{t('RetentionPolicy_DoNotPruneThreads')}</Field.Label>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id={attachedCheckboxId} checked={attached} onChange={handleAttached} />
						<Field.Label htmlFor={attachedCheckboxId}>{t('Files_only')}</Field.Label>
					</Field.Row>
				</Field>
				{callOutText && !validateText && <Callout type='warning'>{callOutText}</Callout>}
				{validateText && <Callout type='warning'>{validateText}</Callout>}
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button danger disabled={Boolean(validateText)} onClick={onClickPrune}>
						{t('Prune')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default PruneMessages;
