import { Box, Field, Select, Button, InputBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import VerticalBar from '../../../../../components/VerticalBar';

const EditInvite = ({ onClickBack, onClickClose, onClickNewLink, days, setDays, maxUses, setMaxUses }) => {
	const t = useTranslation();

	const daysOptions = useMemo(
		() => [
			[1, 1],
			[7, 7],
			[15, 15],
			[30, 30],
			[0, t('Never')],
		],
		[t],
	);

	const maxUsesOptions = useMemo(
		() => [
			[5, 5],
			[10, 10],
			[25, 25],
			[50, 50],
			[100, 100],
			[0, t('No_Limit')],
		],
		[t],
	);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('Invite_Users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent>
				<Field>
					<Field.Label flexGrow={0}>{t('Expiration_(Days)')}</Field.Label>
					<Field.Row>
						{days === undefined ? <InputBox.Skeleton /> : <Select value={days} onChange={setDays} options={daysOptions} />}
					</Field.Row>
				</Field>

				<Field pb='x16'>
					<Field.Label flexGrow={0}>{t('Max_number_of_uses')}</Field.Label>
					<Field.Row>
						{maxUses === undefined ? <InputBox.Skeleton /> : <Select value={maxUses} onChange={setMaxUses} options={maxUsesOptions} />}
					</Field.Row>
				</Field>

				<Box pb='x16'>
					<Button primary onClick={onClickNewLink}>
						{t('Generate_New_Link')}
					</Button>
				</Box>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default EditInvite;
