import { AutoComplete, Option, Avatar, Field, FieldRow, FieldDescription } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isFirstPeerAutocompleteOption } from '../MediaCallContext';

export type PeerAutocompleteOptions = {
	value: string; // user id
	label: string; // name or username
	identifier?: string | number; // extension number
	avatarUrl?: string;
};

type PeerAutocompleteProps = {
	options: PeerAutocompleteOptions[];
	onChangeValue: (value: string | string[]) => void;
	onChangeFilter: (filter: string) => void;
	filter: string;
	value: string | undefined;
};

const PeerAutocomplete = ({ options, filter, value, onChangeValue, onChangeFilter }: PeerAutocompleteProps) => {
	const { t } = useTranslation();

	const id = useId();

	return (
		<Field mb={-2}>
			<FieldRow>
				<AutoComplete
					aria-labelledby={id}
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
						return <Option key={value} label={label} avatar={<Avatar size='x20' url={thisOption?.avatarUrl || ''} />} {...props} />;
					}}
					renderSelected={() => null}
				/>
			</FieldRow>
			<FieldDescription id={id}>{t('Enter_username_or_number')}</FieldDescription>
		</Field>
	);
};

export default PeerAutocomplete;
