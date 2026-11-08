import { UserStatus } from '@rocket.chat/core-typings';
import {
	AutoComplete,
	Avatar,
	Field,
	FieldRow,
	FieldDescription,
	FieldError,
	ItemContent,
	ItemIcon,
	ItemTitle,
	Option,
	StatusBullet,
} from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE } from '@rocket.chat/ui-avatar';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isFirstPeerAutocompleteOption } from '../context';

export type PeerAutocompleteOptions = {
	value: string; // user id
	label: string; // name or username
	status?: UserStatus;
	identifier?: string | number; // extension number
	avatarUrl?: string;
};

export type PeerAutocompleteProps = {
	options: PeerAutocompleteOptions[];
	onChangeValue: (value: string | string[]) => void;
	onChangeFilter: (filter: string) => void;
	filter: string;
	value: string | undefined;
	error?: string;
};

const STATUS_LABEL_KEYS = {
	[UserStatus.ONLINE]: 'Online',
	[UserStatus.AWAY]: 'Away',
	[UserStatus.BUSY]: 'Busy',
	[UserStatus.OFFLINE]: 'Offline',
	[UserStatus.DISABLED]: 'Disabled',
} as const;

const PeerAutocomplete = ({ options, filter, value, onChangeValue, onChangeFilter, error }: PeerAutocompleteProps) => {
	const { t } = useTranslation();

	const fieldDescriptionId = useId();
	const fieldErrorId = useId();

	return (
		<Field>
			<FieldRow>
				<AutoComplete
					aria-labelledby={fieldDescriptionId}
					aria-describedby={error ? fieldErrorId : undefined}
					aria-invalid={!!error}
					error={!!error}
					setFilter={onChangeFilter}
					filter={filter}
					onChange={onChangeValue}
					options={options}
					value={value}
					renderItem={({ value, label, ...props }) => {
						if (isFirstPeerAutocompleteOption(value)) {
							return <Option {...props} label={label} icon='phone-out' iconLabel={t('Call')} />;
						}

						const thisOption = options.find((option) => option.value === value);

						return (
							<Option {...props} avatar={<Avatar size={ITEM_MEDIA_SIZE.condensed} url={thisOption?.avatarUrl || ''} />}>
								<ItemIcon label={thisOption?.status && t(STATUS_LABEL_KEYS[thisOption.status])}>
									<StatusBullet status={thisOption?.status} />
								</ItemIcon>
								<ItemContent>
									<ItemTitle>{label}</ItemTitle>
								</ItemContent>
							</Option>
						);
					}}
					renderSelected={() => null}
				/>
			</FieldRow>
			{error && <FieldError id={fieldErrorId}>{error}</FieldError>}
			<FieldDescription id={fieldDescriptionId}>{t('Enter_username_or_number')}</FieldDescription>
		</Field>
	);
};

export default PeerAutocomplete;
