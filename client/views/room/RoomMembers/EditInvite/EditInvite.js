import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Box, Field, Select, Button, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useEndpoint } from '../../../../contexts/ServerContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/basic/VerticalBar';

export const EditInvite = ({
	onClickBack,
	onClickClose,
	onClickNewLink,
	days,
	setDays,
	maxUses,
	setMaxUses,
}) => {
	const t = useTranslation();

	const daysOptions = useMemo(() => [
		[1, 1],
		[7, 7],
		[15, 15],
		[30, 30],
		[0, t('Never')],
	], [t]);

	const maxUsesOptions = useMemo(() => [
		[5, 5],
		[10, 10],
		[25, 25],
		[50, 50],
		[100, 100],
		[0, t('No_Limit')],
	], [t]);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Action onClick={onClickBack} name='arrow-back' />}
				<VerticalBar.Text>{t('Invite_Users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box width='full' pi='x12' pb='x12'>
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
						<Button onClick={onClickNewLink}>{t('Generate_New_Link')}</Button>
					</Box>
				</Box>
			</VerticalBar.Content>
		</>
	);
};

export default ({
	rid,
	tabBar,
}) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const onClickBack = useMutableCallback(() => tabBar.setTemplate('InviteUsers'));
	const buildInviteLink = useEndpoint('POST', 'findOrCreateInvite');

	const [days, setDays] = useState();
	const [maxUses, setMaxUses] = useState();

	const handleInviteLink = useCallback(async (days, maxUses) => {
		try {
			const data = await buildInviteLink({
				rid,
				days,
				maxUses,
			});
			setMaxUses(data.maxUses);
			setDays(data.days);
			return data;
		} catch (error) {
			console.log(error);
		}
	}, [buildInviteLink, rid]);

	const generateLink = useCallback(() => {
		const result = handleInviteLink(days, maxUses);
		result.then((data) => {
			data.success && onClickBack();
		}).catch((error) => {
			console.log(error);
		});
	}, [onClickBack, handleInviteLink, days, maxUses]);

	useEffect(() => {
		handleInviteLink();
	}, [handleInviteLink]);

	return (
		<EditInvite
			onClickBack={onClickBack}
			onClickClose={onClickClose}
			onClickNewLink={generateLink}
			days={days}
			setDays={setDays}
			maxUses={maxUses}
			setMaxUses={setMaxUses}
		/>
	);
};
