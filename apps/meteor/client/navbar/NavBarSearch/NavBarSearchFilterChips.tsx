import type { AppliedFilter } from '@rocket.chat/ai-search';
import { getAppliedFilterLabel, getAppliedFilterTitle } from '@rocket.chat/ai-search';
import { Box, Chip, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export type NavBarSearchFilterChipsProps = {
	filters: AppliedFilter[];
	onRemove: (id: string) => void;
	wrap?: boolean;
};

const NavBarSearchFilterChips = ({ filters, onRemove, wrap = false }: NavBarSearchFilterChipsProps): ReactElement | null => {
	const { t } = useTranslation();

	if (!filters.length) {
		return null;
	}

	return (
		<Box
			display='flex'
			alignItems='center'
			gap={4}
			flexWrap={wrap ? 'wrap' : 'nowrap'}
			{...(!wrap && { maxWidth: 'x320', overflow: 'auto' })}
		>
			{filters.map((filter) => {
				const label = getAppliedFilterLabel(filter);

				return (
					<Chip
						key={filter.id}
						height='x20'
						minHeight='x20'
						value={label}
						onClick={() => onRemove(filter.id)}
						title={getAppliedFilterTitle(filter, t)}
						aria-label={t('Remove_filter', { filter: label })}
						renderDismissSymbol={() => <Icon name='cross' size='x12' />}
					>
						<Box is='span' maxWidth='x104' withTruncatedText>
							{label}
						</Box>
					</Chip>
				);
			})}
		</Box>
	);
};

export default NavBarSearchFilterChips;
