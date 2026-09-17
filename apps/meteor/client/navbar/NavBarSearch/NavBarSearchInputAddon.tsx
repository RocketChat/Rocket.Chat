import type { SearchFilterChip } from '@rocket.chat/ai-search';
import { Box, Chip, Icon, IconButton } from '@rocket.chat/fuselage';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';

export type NavBarSearchInputAddonProps = {
	appliedFilterChips: SearchFilterChip[];
	aiSearchActive: boolean;
	aiSearchButtonTooltip: string;
	hasSearchText: boolean;
	onClearText: () => void;
	onRemoveFilter: (filterKey: string) => void;
	onToggleAISearch: () => void;
	t: TFunction;
};

const NavBarSearchInputAddon = ({
	appliedFilterChips,
	aiSearchActive,
	aiSearchButtonTooltip,
	hasSearchText,
	onClearText,
	onRemoveFilter,
	onToggleAISearch,
	t,
}: NavBarSearchInputAddonProps): ReactElement => (
	<Box display='flex' alignItems='center' gap={8}>
		{appliedFilterChips.length > 0 && (
			<Box display='flex' alignItems='center' gap={4} maxWidth='x320' overflow='auto'>
				{appliedFilterChips.map((filter) => (
					<Chip
						key={filter.key}
						height='x20'
						minHeight='x20'
						value={filter.label}
						onClick={() => onRemoveFilter(filter.key)}
						title={filter.title}
						aria-label={t('Remove_filter', { filter: filter.label })}
						renderDismissSymbol={() => <Icon name='cross' size='x12' />}
					>
						<Box is='span' maxWidth='x104' withTruncatedText>
							{filter.label}
						</Box>
					</Chip>
				))}
			</Box>
		)}
		{hasSearchText ? <IconButton mini icon='cross' aria-label={t('Clear')} onClick={onClearText} /> : <Icon name='magnifier' size='x20' />}
		<IconButton
			mini
			icon='stars'
			pressed={aiSearchActive}
			aria-label={aiSearchButtonTooltip}
			title={aiSearchButtonTooltip}
			onClick={onToggleAISearch}
		/>
	</Box>
);

export default NavBarSearchInputAddon;
