import { Box, Icon, TextInput, Field, CheckBox, Margins } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useEffect } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

export const DEFAULT_TYPES = ['d', 'p', 'c', 'teams'];

export const roomTypeI18nMap = {
	l: 'Omnichannel',
	c: 'Channel',
	d: 'Direct',
	p: 'Group',
	discussion: 'Discussion',
	team: 'Team',
};

const FilterByTypeAndText = ({ setFilter, ...props }) => {
	const [text, setText] = useState('');
	const [types, setTypes] = useState({
		d: false,
		c: false,
		p: false,
		l: false,
		discussions: false,
		teams: false,
	});

	const t = useTranslation();

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);
	const handleCheckBox = useCallback(
		(type) => setTypes({ ...types, [type]: !types[type] }),
		[types],
	);

	useEffect(() => {
		if (Object.values(types).filter(Boolean).length === 0) {
			return setFilter({ text, types: DEFAULT_TYPES });
		}
		const _types = Object.entries(types)
			.filter(([, value]) => Boolean(value))
			.map(([key]) => key);
		setFilter({ text, types: _types });
	}, [setFilter, text, types]);

	const idDirect = useUniqueId();
	const idDPublic = useUniqueId();
	const idPrivate = useUniqueId();
	const idOmnichannel = useUniqueId();
	const idDiscussions = useUniqueId();
	const idTeam = useUniqueId();

	return (
		<Box
			mb='x16'
			is='form'
			onSubmit={useCallback((e) => e.preventDefault(), [])}
			display='flex'
			flexDirection='column'
			{...props}
		>
			<TextInput
				flexShrink={0}
				placeholder={t('Search_Rooms')}
				addon={<Icon name='magnifier' size='x20' />}
				onChange={handleChange}
				value={text}
			/>
			<Field>
				<Box
					display='flex'
					flexDirection='row'
					flexWrap='wrap'
					justifyContent='flex-start'
					mbs='x8'
					mi='neg-x8'
				>
					<Margins inline='x8'>
						<Field.Row>
							<CheckBox checked={types.d} id={idDirect} onChange={() => handleCheckBox('d')} />
							<Field.Label htmlFor={idDirect}>{t('Direct')}</Field.Label>
						</Field.Row>
						<Field.Row>
							<CheckBox checked={types.c} id={idDPublic} onChange={() => handleCheckBox('c')} />
							<Field.Label htmlFor={idDPublic}>{t('Public')}</Field.Label>
						</Field.Row>
						<Field.Row>
							<CheckBox checked={types.p} id={idPrivate} onChange={() => handleCheckBox('p')} />
							<Field.Label htmlFor={idPrivate}>{t('Private')}</Field.Label>
						</Field.Row>
						<Field.Row>
							<CheckBox checked={types.l} id={idOmnichannel} onChange={() => handleCheckBox('l')} />
							<Field.Label htmlFor={idOmnichannel}>{t('Omnichannel')}</Field.Label>
						</Field.Row>
						<Field.Row>
							<CheckBox
								checked={types.discussions}
								id={idDiscussions}
								onChange={() => handleCheckBox('discussions')}
							/>
							<Field.Label htmlFor={idDiscussions}>{t('Discussions')}</Field.Label>
						</Field.Row>
						<Field.Row>
							<CheckBox
								checked={types.teams}
								id={idTeam}
								onChange={() => handleCheckBox('teams')}
							/>
							<Field.Label htmlFor={idTeam}>{t('Teams')}</Field.Label>
						</Field.Row>
					</Margins>
				</Box>
			</Field>
		</Box>
	);
};

export default FilterByTypeAndText;
