import type { ReactNode } from 'react';

export type OptionType<TValue = string | number, TLabel = ReactNode> =
	| [value: TValue, label: TLabel, selected?: boolean, disabled?: boolean, type?: 'option', url?: string]
	| [value: TValue, label: ReactNode, selected: unknown, disabled: unknown, type: 'heading', url?: string]
	| [value: TValue, label: unknown, selected: unknown, disabled: unknown, type: 'divider', url?: string];
