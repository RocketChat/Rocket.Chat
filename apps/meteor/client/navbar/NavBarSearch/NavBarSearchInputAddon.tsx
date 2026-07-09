import type { SearchFilterChip } from '@rocket.chat/ai-search';
import { Box, Chip, Icon, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type NavBarSearchInputAddonProps = {
	appliedFilterChips: SearchFilterChip[];
	aiSearchActive: boolean;
	aiSearchFeatureEnabled: boolean;
	aiSearchButtonTooltip: string;
	isDirty: boolean;
	onClearText: () => void;
	onRemoveFilter: (filterKey: string) => void;
	onToggleAISearch: () => void;
	t: (key: string) => string;
};

const getFilterChipLabel = (label: string): string => label.replace(/^in:\s*/, '').replace(/^from:\s*/, '');

const NavBarSearchInputAddon = ({
	appliedFilterChips,
	aiSearchActive,
	aiSearchFeatureEnabled,
	aiSearchButtonTooltip,
	isDirty,
	onClearText,
	onRemoveFilter,
	onToggleAISearch,
	t,
}: NavBarSearchInputAddonProps): ReactElement => (
	<Box display='flex' alignItems='center' gap={8}>
		{appliedFilterChips.length > 0 && (
			<Box display='flex' alignItems='center' gap={4} maxWidth='x320' overflow='hidden'>
				{appliedFilterChips.map((filter) => {
					const label = getFilterChipLabel(filter.label);

					return (
						<Chip
							key={filter.key}
							height='x20'
							minHeight='x20'
							fontScale='c1'
							value={label}
							onClick={() => onRemoveFilter(filter.key)}
							title={filter.title}
							renderDismissSymbol={() => <Icon name='cross' size='x12' />}
						>
							<Box is='span' maxWidth='x104' withTruncatedText fontScale='c1'>
								{label}
							</Box>
						</Chip>
					);
				})}
			</Box>
		)}
		{isDirty ? (
			<IconButton mini icon='cross' aria-label={t('Clear')} onClick={onClearText} />
		) : (
			<Icon name='magnifier' size='x20' aria-label={t('Search')} />
		)}
		{aiSearchFeatureEnabled && (
			<IconButton
				mini
				icon='stars'
				pressed={aiSearchActive}
				aria-label={aiSearchButtonTooltip}
				title={aiSearchButtonTooltip}
				onClick={onToggleAISearch}
			/>
		)}
	</Box>
);

export default NavBarSearchInputAddon;
