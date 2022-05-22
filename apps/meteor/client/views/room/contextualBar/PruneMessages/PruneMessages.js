import { Field, ButtonGroup, Button, CheckBox, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import VerticalBar from '../../../../components/VerticalBar';
import DateTimeRow from './DateTimeRow';

const PruneMessages = ({
	callOutText,
	validateText,
	newerDateTime,
	handleNewerDateTime,
	olderDateTime,
	handleOlderDateTime,
	users,
	inclusive,
	pinned,
	discussion,
	threads,
	attached,
	handleInclusive,
	handlePinned,
	handleDiscussion,
	handleThreads,
	handleAttached,
	onClickClose,
	onClickPrune,
	onChangeUsers,
}) => {
	const t = useTranslation();

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
				<DateTimeRow label={t('Newer_than')} dateTime={newerDateTime} handleDateTime={handleNewerDateTime} />
				<DateTimeRow label={t('Older_than')} dateTime={olderDateTime} handleDateTime={handleOlderDateTime} />

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
					<Button primary danger disabled={validateText && true} onClick={onClickPrune}>
						{t('Prune')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default PruneMessages;
