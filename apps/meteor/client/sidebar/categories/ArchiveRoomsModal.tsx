import { Box } from '@rocket.chat/fuselage';
import { CheckBox, Field, FieldGroup, FieldLabel, FieldRow, NumberInput, Select } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useLanguage, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DateInput from './DateInput';
import { HOUR } from './hooks/useActivityFilter';
import type { ArchiveRoomsMode } from './hooks/useArchiveRoomsItems';
import { useArchivedRooms } from '../../hooks/useArchivedRooms';
import { useOpenedRoom } from '../../lib/RoomManager';
import { getLastActivity } from '../hooks/useRoomList';
import { isUnreadRoom } from '../lib/unreadRooms';

const DAY = 24 * HOUR;

/** The ages offered for "Older than", in days; any whole number of days goes in the custom field. */
const OLDER_THAN_PRESETS = [30, 90, 180, 365];

/** The dates offered for "Inactive since", as months before today; any date goes in the custom field. */
const INACTIVE_SINCE_PRESETS = [1, 3, 6, 12];

const CUSTOM = 'custom';

/** "30 days", "1 year": the age in the user's language, English for a tag `Intl` rejects. */
const formatAge = (language: string, days: number): string => {
	const [unit, value] = days % 365 === 0 ? (['year', days / 365] as const) : (['day', days] as const);
	try {
		return new Intl.NumberFormat(language, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
	} catch {
		return new Intl.NumberFormat('en', { style: 'unit', unit, unitDisplay: 'long' }).format(value);
	}
};

/** "3 months ago", "1 year ago": the date preset in the user's language, English for a tag `Intl` rejects. */
const formatMonthsAgo = (language: string, months: number): string => {
	const [unit, value] = months % 12 === 0 ? (['year', months / 12] as const) : (['month', months] as const);
	try {
		return new Intl.RelativeTimeFormat(language, { numeric: 'always' }).format(-value, unit);
	} catch {
		return new Intl.RelativeTimeFormat('en', { numeric: 'always' }).format(-value, unit);
	}
};

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

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

const monthsAgo = (months: number): Date => {
	const date = startOfDay(new Date());
	date.setMonth(date.getMonth() - months);
	return date;
};

export type ArchiveRoomsModalProps = {
	mode: ArchiveRoomsMode;
	/** The group as its header names it. */
	groupTitle: string;
	/** Every room of the group; the modal picks the quiet ones. */
	rooms: SubscriptionWithRoom[];
	onClose: () => void;
};

/**
 * Archives the rooms of a group that have been quiet since a date ("Inactive since…") or for an age ("Older
 * than…"), each with presets and a custom value. The room open right now stays, as does a room with no date to
 * judge by; unread rooms stay too unless asked for, so the archive never takes something unseen without saying so.
 */
const ArchiveRoomsModal = ({ mode, groupTitle, rooms, onClose }: ArchiveRoomsModalProps) => {
	const { t } = useTranslation();
	const language = useLanguage();
	const dispatchToastMessage = useToastMessageDispatch();
	const openedRoom = useOpenedRoom();
	const { archiveRooms } = useArchivedRooms();

	const [preset, setPreset] = useState<string>(String(mode === 'older-than' ? OLDER_THAN_PRESETS[0] : INACTIVE_SINCE_PRESETS[0]));
	const [customDays, setCustomDays] = useState<string>('30');
	const [customDate, setCustomDate] = useState<string>('');
	const [includeUnread, setIncludeUnread] = useState(false);

	const options = useMemo<[string, string][]>(
		() =>
			mode === 'older-than'
				? [...OLDER_THAN_PRESETS.map((days): [string, string] => [String(days), formatAge(language, days)]), [CUSTOM, t('Custom')]]
				: [
						...INACTIVE_SINCE_PRESETS.map((months): [string, string] => [String(months), formatMonthsAgo(language, months)]),
						[CUSTOM, t('Custom_date')],
					],
		[mode, language, t],
	);

	// The instant a room must have been active after to stay; `undefined` while the custom value is not one yet.
	const threshold = useMemo((): number | undefined => {
		if (mode === 'older-than') {
			const days = preset === CUSTOM ? Number(customDays) : Number(preset);
			return Number.isInteger(days) && days >= 1 ? Date.now() - days * DAY : undefined;
		}
		const since = preset === CUSTOM ? fromDateInputValue(customDate) : monthsAgo(Number(preset));
		return since?.getTime();
	}, [mode, preset, customDays, customDate]);

	const candidates = useMemo(
		() =>
			threshold === undefined
				? []
				: rooms.filter(
						(room) => room.rid !== openedRoom && (includeUnread || !isUnreadRoom(room)) && (getLastActivity(room) ?? Infinity) < threshold,
					),
		[rooms, threshold, openedRoom, includeUnread],
	);

	const handleConfirm = () => {
		archiveRooms(candidates.map((room) => room.rid));
		dispatchToastMessage({ type: 'success', message: t('Rooms_archived', { count: candidates.length }) });
		onClose();
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
					<FieldLabel>{mode === 'older-than' ? t('Older_than') : t('Inactive_since')}</FieldLabel>
					<FieldRow>
						<Select options={options} value={preset} onChange={(key) => setPreset(String(key))} />
					</FieldRow>
				</Field>
				{preset === CUSTOM && mode === 'older-than' && (
					<Field>
						<FieldLabel>{t('Days')}</FieldLabel>
						<FieldRow>
							<NumberInput min={1} step={1} value={customDays} onChange={(event) => setCustomDays(event.currentTarget.value)} />
						</FieldRow>
					</Field>
				)}
				{preset === CUSTOM && mode === 'inactive-since' && (
					<Field>
						<FieldLabel>{t('Date')}</FieldLabel>
						<FieldRow>
							<DateInput
								max={toDateInputValue(new Date())}
								value={customDate}
								onChange={(event) => setCustomDate(event.currentTarget.value)}
							/>
						</FieldRow>
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
