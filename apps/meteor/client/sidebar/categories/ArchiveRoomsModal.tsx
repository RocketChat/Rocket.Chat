import { Box } from '@rocket.chat/fuselage';
import { CheckBox, Field, FieldError, FieldGroup, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useLanguage, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DateInput from './DateInput';
import { HOUR } from './hooks/useActivityFilter';
import { useArchivedRooms } from '../../hooks/useArchivedRooms';
import { useOpenedRoom } from '../../lib/RoomManager';
import { getLastActivity } from '../hooks/useRoomList';
import { isUnreadRoom } from '../lib/unreadRooms';

const DAY = 24 * HOUR;

/** The quiet spells offered, in days; any other threshold goes in as a date. */
const INACTIVE_FOR_PRESETS = [30, 90, 180, 365];

const CUSTOM_DATE = 'custom-date';

/** "30 days", "1 year": the age in the user's language, English for a tag `Intl` rejects. */
const formatAge = (language: string, days: number): string => {
	const [unit, value] = days % 365 === 0 ? (['year', days / 365] as const) : (['day', days] as const);
	try {
		return new Intl.NumberFormat(language, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
	} catch {
		return new Intl.NumberFormat('en', { style: 'unit', unit, unitDisplay: 'long' }).format(value);
	}
};

/** Today, as a date input writes it, for the input's upper bound. */
const toDateInputValue = (date: Date): string =>
	[date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

/** The date a date input holds, as local midnight; `undefined` while it holds none or nonsense. */
const fromDateInputValue = (value: string): Date | undefined => {
	const [year, month, day] = value.split('-').map(Number);
	if (!year || !month || !day) {
		return undefined;
	}
	const date = new Date(year, month - 1, day);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

export type ArchiveRoomsModalProps = {
	/** The group as its header names it. */
	groupTitle: string;
	/** Every room of the group; the modal picks the quiet ones. */
	rooms: SubscriptionWithRoom[];
	onClose: () => void;
};

/**
 * Archives the rooms of a group that have been quiet for a spell chosen from presets, or since a date typed in.
 * The room open right now stays, as does a room with no date to judge by; unread rooms stay too unless asked
 * for, so the archive never takes something unseen without saying so.
 */
const ArchiveRoomsModal = ({ groupTitle, rooms, onClose }: ArchiveRoomsModalProps) => {
	const { t } = useTranslation();
	const language = useLanguage();
	const dispatchToastMessage = useToastMessageDispatch();
	const openedRoom = useOpenedRoom();
	const { archiveRooms } = useArchivedRooms();

	const [preset, setPreset] = useState<string>(String(INACTIVE_FOR_PRESETS[0]));
	const [customDate, setCustomDate] = useState<string>('');
	const [includeUnread, setIncludeUnread] = useState(false);

	const options = useMemo<[string, string][]>(
		() => [
			...INACTIVE_FOR_PRESETS.map((days): [string, string] => [String(days), formatAge(language, days)]),
			[CUSTOM_DATE, t('Custom_date')],
		],
		[language, t],
	);

	// A date still to come has nothing quiet since it; the input's `max` stops the picker, not the keyboard, so the
	// field says so itself.
	const customDateInFuture = useMemo(() => {
		const since = fromDateInputValue(customDate)?.getTime();
		return preset === CUSTOM_DATE && since !== undefined && since > Date.now();
	}, [preset, customDate]);

	// The instant a room must have been active after to stay; `undefined` while the date typed in is not one yet.
	const threshold = useMemo((): number | undefined => {
		if (preset !== CUSTOM_DATE) {
			return Date.now() - Number(preset) * DAY;
		}
		const since = fromDateInputValue(customDate)?.getTime();
		return since !== undefined && since <= Date.now() ? since : undefined;
	}, [preset, customDate]);

	const candidates = useMemo(
		() =>
			threshold === undefined
				? []
				: rooms.filter(
						(room) => room.rid !== openedRoom && (includeUnread || !isUnreadRoom(room)) && (getLastActivity(room) ?? Infinity) < threshold,
					),
		[rooms, threshold, openedRoom, includeUnread],
	);

	const handleConfirm = async () => {
		onClose();
		const { changed } = await archiveRooms(candidates.map((room) => room.rid));
		if (changed) {
			dispatchToastMessage({ type: 'success', message: t('Rooms_archived', { count: changed }) });
		}
	};

	return (
		<GenericModal
			title={t('Archive_rooms_in__group__', { group: groupTitle })}
			icon={null}
			variant='warning'
			confirmText={t('Archive')}
			confirmDisabled={candidates.length === 0}
			annotation={t('Archived_rooms_stay_until_unarchived')}
			onConfirm={handleConfirm}
			onCancel={onClose}
		>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Inactive_for')}</FieldLabel>
					<FieldRow>
						<Select options={options} value={preset} onChange={(key) => setPreset(String(key))} />
					</FieldRow>
				</Field>
				{preset === CUSTOM_DATE && (
					<Field>
						<FieldLabel>{t('Inactive_since')}</FieldLabel>
						<FieldRow>
							{/* The field appears on request, so it takes the focus the user would move to it next anyway. */}
							<DateInput
								autoFocus
								max={toDateInputValue(new Date())}
								value={customDate}
								onChange={(event) => setCustomDate(event.currentTarget.value)}
							/>
						</FieldRow>
						{customDateInFuture && <FieldError>{t('Choose_today_or_an_earlier_date')}</FieldError>}
					</Field>
				)}
				<Field>
					<FieldRow>
						<FieldLabel>{t('Include_unread_rooms')}</FieldLabel>
						<CheckBox checked={includeUnread} onChange={() => setIncludeUnread((value) => !value)} />
					</FieldRow>
				</Field>
			</FieldGroup>
			<Box marginBlockStart={16} fontScale='p2' role='status'>
				{candidates.length > 0 ? t('Rooms_to_archive', { count: candidates.length }) : t('No_rooms_to_archive')}
			</Box>
		</GenericModal>
	);
};

export default ArchiveRoomsModal;
