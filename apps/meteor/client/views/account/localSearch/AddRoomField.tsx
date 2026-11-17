import { Box, Button, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';

import { roomLabel } from './IndexedRoomRow';
import { startIndexingSearchRoom } from '../../../lib/e2ee/rocketchat.e2e';
import { Subscriptions } from '../../../stores';

/** The encrypted rooms of the user that this device does not index yet, and the action that adds one. */
const AddRoomField = ({ chosen }: { chosen: readonly string[] }) => {
	const { t } = useTranslation();
	const id = useId();
	const [selected, setSelected] = useState<string>('');
	const candidates = Subscriptions.use(
		useShallow((state) => state.filter((subscription) => subscription.encrypted === true && !chosen.includes(subscription.rid))),
	);
	const options: [string, string][] = candidates.map((subscription) => [subscription.rid, roomLabel(subscription, subscription.rid)]);

	return (
		<Field>
			<FieldLabel htmlFor={id}>{t('E2E_Local_Search_Add_Room')}</FieldLabel>
			<FieldRow>
				<Box display='flex' gap={8} width='full'>
					<Select
						id={id}
						options={options}
						value={selected}
						placeholder={t('E2E_Local_Search_Add_Room_Placeholder')}
						onChange={(value) => setSelected(String(value))}
						disabled={options.length === 0}
					/>
					<Button
						variant='primary'
						disabled={!selected}
						onClick={() => {
							if (startIndexingSearchRoom(selected)) setSelected('');
						}}
					>
						{t('E2E_Local_Search_Index_Room')}
					</Button>
				</Box>
			</FieldRow>
		</Field>
	);
};

export default AddRoomField;
