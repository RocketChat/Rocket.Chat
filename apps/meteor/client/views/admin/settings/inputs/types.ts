import type { ReactNode } from 'react';

export type SettingInputProps<V = string, R = V> = {
	_id: string;
	label: ReactNode;
	value?: V;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled: boolean;
	required?: boolean;
	hint?: string;
	editor?: string;
	hasResetButton: boolean;
	onChangeValue: (value: R) => void;
	onResetButtonClick?: () => void;
	onChangeEditor?: (value: string | undefined) => void;
};
