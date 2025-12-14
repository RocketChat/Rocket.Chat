import type { UserStatus } from '@rocket.chat/core-typings';
import { AutoComplete, Option, Avatar, Field, FieldRow, FieldDescription, FieldError, StatusBullet, Box } from '@rocket.chat/fuselage';
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

type PeerAutocompleteProps = {
	options: PeerAutocompleteOptions[];
	onChangeValue: (value: string | string[]) => void;
	onChangeFilter: (filter: string) => void;
	filter: string;
	value: string | undefined;
	error?: string;
};

const PeerAutocomplete = ({ options, filter, value, onChangeValue, onChangeFilter, error }: PeerAutocompleteProps) => {
	const { t } = useTranslation();

	const fieldDescriptionId = useId();
	const fieldErrorId = useId();

	return (
		<Field mb={-2}>
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
							return <Option key={value} label={label} icon='phone-out' {...props} />;
						}
						const thisOption = options.find((option) => option.value === value);
						return (
							<Option
								key={value}
								label={
									<Box display='flex' flexDirection='row' alignItems='center'>
										<StatusBullet status={thisOption?.status} />
										<Box mis={4}>{label}</Box>
									</Box>
								}
								avatar={<Avatar size='x20' url={thisOption?.avatarUrl || ''} />}
								{...props}
							/>
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
