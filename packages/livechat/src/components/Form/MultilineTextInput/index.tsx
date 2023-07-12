import type { JSXInternal } from 'preact/src/jsx';
import type { ControllerRenderProps } from 'react-hook-form';

import { createClassName } from '../../helpers';

type MultilineTextInputProps = {
	name: string;
	placeholder?: string;
	disabled?: boolean;
	small?: boolean;
	rows?: number;
	error?: boolean;
	className?: string;
	style?: JSXInternal.CSSProperties;
	field: ControllerRenderProps<{ [key: string]: string }, any>;
};

export const MultilineTextInput = ({
	name,
	placeholder,
	disabled,
	small,
	rows = 1,
	error,
	className,
	style = {},
	field,
}: MultilineTextInputProps) => (
	<textarea
		rows={rows}
		name={name}
		placeholder={placeholder}
		disabled={disabled}
		className={createClassName(null, 'text-input', { disabled, error, small }, [className])}
		style={style}
		// TODO: find a better way to handle the difference between react and preact on TS
		{...(field as any)}
	/>
);
