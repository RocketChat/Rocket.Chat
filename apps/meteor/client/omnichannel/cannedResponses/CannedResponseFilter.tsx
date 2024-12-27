import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select } from '@rocket.chat/fuselage';
import type { ChangeEvent } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../components/AutoCompleteAgent';

type SharingValues = '' | 'user' | 'global' | 'department';

type CannedResponsesFilterProps = {
	createdBy: string;
	setCreatedBy: (value: string) => void;
	sharing: SharingValues;
	setSharing: (value: SharingValues) => void;
	text: string;
	setText: (text: string) => void;
};

const CannedResponsesFilter = ({ createdBy, setCreatedBy, sharing, setSharing, text, setText }: CannedResponsesFilterProps) => {
	const { t } = useTranslation();

	const sharingList: SelectOption[] = [
		['', t('All')],
		['user', t('Private')],
		['global', t('Public')],
		['department', t('Department')],
	];

	return (
		<Box mb={16} display='flex' flexDirection='row'>
			<Box display='flex' mie={8} flexGrow={1} flexDirection='column'>
				<Box mb={4}>{t('Search')}</Box>
				<TextInput
					value={text}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
					addon={<Icon name='magnifier' size='x20' />}
				/>
			</Box>
			<Box display='flex' mie={8} flexGrow={1} flexDirection='column'>
				<Box mb={4}>{t('Sharing')}</Box>
				<Select value={sharing} onChange={(value) => setSharing(value as SharingValues)} options={sharingList} />
			</Box>
			<Box display='flex' mie={8} flexGrow={1} flexDirection='column'>
				<Box mb={4}>{t('Created_by')}</Box>
				<AutoCompleteAgent value={createdBy} onChange={setCreatedBy} haveAll />
			</Box>
		</Box>
	);
};

export default memo(CannedResponsesFilter);
