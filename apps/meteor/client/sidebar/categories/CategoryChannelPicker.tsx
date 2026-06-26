import { Box, CheckBox, Icon, TextInput } from '@rocket.chat/fuselage';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CategoryChannelOption } from './useCategoryChannels';

type CategoryChannelPickerProps = {
	channels: CategoryChannelOption[];
	selected: string[];
	onToggle: (rid: string) => void;
};

const CategoryChannelPicker = ({ channels, selected, onToggle }: CategoryChannelPickerProps) => {
	const { t } = useTranslation();
	const labelId = useId();
	const [filter, setFilter] = useState('');

	const filtered = useMemo(() => {
		const term = filter.trim().toLowerCase();
		if (!term) {
			return channels;
		}
		return channels.filter((channel) => channel.name.toLowerCase().includes(term));
	}, [channels, filter]);

	if (channels.length === 0) {
		return (
			<Box
				display='flex'
				alignItems='center'
				justifyContent='center'
				p={24}
				color='hint'
				fontScale='p2'
				borderWidth='default'
				borderColor='extra-light'
				borderRadius='x4'
			>
				{t('All_channels_are_already_in_a_category')}
			</Box>
		);
	}

	return (
		<>
			<Box mbe={8}>
				<TextInput
					value={filter}
					onChange={(e): void => setFilter((e.target as HTMLInputElement).value)}
					placeholder={t('Search')}
					addon={<Icon name='magnifier' size='x20' color='hint' />}
				/>
			</Box>
			<Box borderWidth='default' borderColor='extra-light' borderRadius='x4' maxHeight='x248' overflow='auto' role='list'>
				{filtered.length === 0 ? (
					<Box display='flex' alignItems='center' justifyContent='center' p={24} color='hint' fontScale='p2'>
						{t('No_results_found')}
					</Box>
				) : (
					filtered.map((channel) => {
						const isSelected = selected.includes(channel.rid);
						const id = `${labelId}-${channel.rid}`;
						return (
							<Box
								key={channel.rid}
								is='label'
								htmlFor={id}
								role='listitem'
								display='flex'
								alignItems='center'
								pi={12}
								pb={0}
								style={{ height: 40, cursor: 'pointer' }}
							>
								<CheckBox id={id} checked={isSelected} onChange={(): void => onToggle(channel.rid)} />
								<Icon name={channel.t === 'p' ? 'hashtag-lock' : 'hashtag'} size='x16' color='hint' mis={10} mie={8} />
								<Box withTruncatedText fontScale='p2'>
									{channel.name}
								</Box>
							</Box>
						);
					})
				)}
			</Box>
		</>
	);
};

export default CategoryChannelPicker;
