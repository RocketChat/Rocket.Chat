import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Icon, TextInput, Select } from '@rocket.chat/fuselage';
import type { ChangeEvent } from 'react';
import { memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../components/AutoCompleteAgent';
import CannedResponsesFilterBar from '../layout/CannedResponsesFilterBar';

type SharingValues = '' | 'user' | 'global' | 'department';

export type CannedResponsesFilterProps = {
	createdBy: string;
	setCreatedBy: (value: string) => void;
	sharing: SharingValues;
	setSharing: (value: SharingValues) => void;
	text: string;
	setText: (text: string) => void;
};

const CannedResponsesFilter = ({ createdBy, setCreatedBy, sharing, setSharing, text, setText }: CannedResponsesFilterProps) => {
	const { t } = useTranslation();

	const searchId = useId();
	const sharingField = useId();
	const createdByLabelId = useId();

	const sharingList: SelectOption[] = [
		['', t('All')],
		['user', t('Private')],
		['global', t('Public')],
		['department', t('Department')],
	];

	return (
		<CannedResponsesFilterBar>
			<Field>
				<FieldLabel htmlFor={searchId}>{t('Search')}</FieldLabel>
				<FieldRow>
					<TextInput
						id={searchId}
						value={text}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
						endAddon={<Icon name='magnifier' size='x20' />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel htmlFor={sharingField}>{t('Sharing')}</FieldLabel>
				<FieldRow>
					<Select id={sharingField} value={sharing} onChange={(value) => setSharing(value)} options={sharingList} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel id={createdByLabelId}>{t('Created_by')}</FieldLabel>
				<FieldRow>
					<AutoCompleteAgent aria-labelledby={createdByLabelId} value={createdBy} onChange={setCreatedBy} haveAll />
				</FieldRow>
			</Field>
		</CannedResponsesFilterBar>
	);
};

export default memo(CannedResponsesFilter);
