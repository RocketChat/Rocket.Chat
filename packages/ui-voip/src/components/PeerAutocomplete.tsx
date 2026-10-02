import { UserStatus } from '@rocket.chat/core-typings';
import {
	AutoComplete,
	Avatar,
	Field,
	FieldRow,
	FieldDescription,
	FieldError,
	Icon,
	ITEM_MEDIA_SIZE,
	Item,
	ItemContent,
	ItemIcon,
	ItemMedia,
	ItemTitle,
	StatusBullet,
} from '@rocket.chat/fuselage';
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
		<Field marginBlock={-2}>
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
					renderItem={({ value, label, selected, focus, ...props }) => {
						const itemProps = {
							...props,
							'is': 'li',
							'inset': 'md',
							selected,
							'focused': focus,
							'aria-selected': selected,
						} as const;

						if (isFirstPeerAutocompleteOption(value)) {
							return (
								<Item {...itemProps}>
									<ItemIcon label={t('Call')}>
										<Icon name='phone-out' size='x16' />
									</ItemIcon>
									<ItemContent>
										<ItemTitle>{label}</ItemTitle>
									</ItemContent>
								</Item>
							);
						}

						const thisOption = options.find((option) => option.value === value);

						return (
							<Item {...itemProps}>
								<ItemMedia>
									<Avatar size={ITEM_MEDIA_SIZE.condensed} url={thisOption?.avatarUrl || ''} />
								</ItemMedia>
								<ItemIcon label={thisOption?.status && t(STATUS_LABEL_KEYS[thisOption.status])}>
									<StatusBullet status={thisOption?.status} />
								</ItemIcon>
								<ItemContent>
									<ItemTitle>{label}</ItemTitle>
								</ItemContent>
							</Item>
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
