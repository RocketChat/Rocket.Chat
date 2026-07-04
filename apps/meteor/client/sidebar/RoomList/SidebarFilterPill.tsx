import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';

// Apple-Mail-style filter pill: shows only its icon when unselected, and expands (filling the row, centered)
// to icon + label + count when selected, with a per-filter accent color. Width, label and color are animated.
const pillClass = css`
	display: inline-flex;
	align-items: center;
	justify-content: flex-start;
	block-size: 1.5rem; /* Matches the config menu (tiny IconButton) height. */
	flex: 0 0 auto;
	min-inline-size: 0;
	padding-inline: 0.5rem;
	border: none;
	border-radius: 9999px;
	cursor: pointer;
	white-space: nowrap;
	font-family: inherit;
	font-size: 0.875rem;
	font-weight: 500;
	line-height: 1.25rem;
	color: var(--rcx-color-button-font-on-secondary, #e4e7ea);
	background-color: var(--rcx-color-button-background-secondary-default, #2f343d);
	transition:
		background-color 160ms cubic-bezier(0.69, 0.02, 0.22, 0.98),
		color 160ms cubic-bezier(0.69, 0.02, 0.22, 0.98),
		flex-grow 160ms cubic-bezier(0.69, 0.02, 0.22, 0.98),
		opacity 160ms cubic-bezier(0.69, 0.02, 0.22, 0.98);

	&:hover {
		background-color: var(--rcx-color-button-background-secondary-hover, #383c44);
	}

	/* A filter with no matching rooms is dimmed, unless it's the active one. */
	&[data-empty='true']:not([data-selected='true']) {
		opacity: 0.6;
	}

	/* The label collapses to icon-only when unselected, animating its width. */
	.rcx-filter-pill__label {
		display: grid;
		grid-template-columns: 0fr;
		min-inline-size: 0; /* Let the label shrink so it can truncate on a narrow sidebar. */
		transition: grid-template-columns 160ms cubic-bezier(0.69, 0.02, 0.22, 0.98);
	}

	.rcx-filter-pill__label > span {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.rcx-filter-pill__count {
		flex-shrink: 0; /* The count is never truncated; only the label absorbs the shrink. */
		margin-inline-start: 0.25rem;
	}

	/* Selected pills grow to fill the row (and shrink when it's too narrow), with content centered. */
	&[data-selected='true'] {
		flex-grow: 1;
		flex-shrink: 1;
		justify-content: center;
	}

	&[data-selected='true'] .rcx-filter-pill__label {
		grid-template-columns: 1fr;
	}

	&[data-selected='true'] .rcx-filter-pill__label > span {
		padding-inline-start: 0.25rem;
	}

	/* Per-filter accent for the selected state. */
	&[data-selected='true'][data-color='neutral'],
	&[data-selected='true'][data-color='neutral']:hover {
		color: var(--rcx-color-font-default, #e4e7ea);
		background-color: var(--rcx-color-surface-selected, #383c44);
	}

	&[data-selected='true'][data-color='primary'] {
		color: var(--rcx-color-button-font-on-primary, #ffffff);
		background-color: var(--rcx-color-button-background-primary-default, #095ad2);
	}
	&[data-selected='true'][data-color='primary']:hover {
		background-color: var(--rcx-color-button-background-primary-hover, #095ad2);
	}

	&[data-selected='true'][data-color='danger'] {
		color: var(--rcx-color-button-font-on-danger, #ffffff);
		background-color: var(--rcx-color-button-background-danger-default, #ec0d2a);
	}
	&[data-selected='true'][data-color='danger']:hover {
		background-color: var(--rcx-color-button-background-danger-hover, #d40d27);
	}

	&[data-selected='true'][data-color='light'] {
		color: #1f2329;
		background-color: var(--rcx-color-font-pure-white, #ffffff);
	}
	&[data-selected='true'][data-color='light']:hover {
		background-color: #f2f3f5;
	}
`;

type SidebarFilterPillProps = {
	icon: IconName;
	label: string;
	/** Shown in both states (collapsed and expanded); omit for pills without a count (e.g. "All"). */
	count?: number;
	/** Accent color of the selected state. */
	color?: 'neutral' | 'primary' | 'danger' | 'light';
	selected: boolean;
	onClick: () => void;
};

const SidebarFilterPill = ({ icon, label, count, color = 'neutral', selected, onClick }: SidebarFilterPillProps) => (
	<Box
		is='button'
		type='button'
		className={pillClass}
		data-selected={selected}
		data-color={color}
		data-empty={count === 0}
		onClick={onClick}
		title={label}
		aria-pressed={selected}
		aria-label={count !== undefined ? `${label} ${count}` : label}
	>
		<Icon name={icon} size='x16' />
		<Box is='span' className='rcx-filter-pill__label'>
			<span>{label}</span>
		</Box>
		{count !== undefined && (
			<Box is='span' className='rcx-filter-pill__count'>
				{count}
			</Box>
		)}
	</Box>
);

export default SidebarFilterPill;
