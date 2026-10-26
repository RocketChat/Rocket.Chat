import type { AllHTMLAttributes, RefAttributes, RefObject } from 'react';
import { useButton, type AriaButtonProps } from 'react-aria';

import { Box } from '../Box';

type SelectTriggerProps = AriaButtonProps &
	AllHTMLAttributes<HTMLButtonElement> &
	RefAttributes<HTMLButtonElement> & {
		small?: boolean;
		error?: string;
	};

export function SelectTrigger({ ref, small, error, isDisabled, id, ...props }: SelectTriggerProps) {
	const { buttonProps } = useButton({ ...props, isDisabled }, ref as RefObject<HTMLButtonElement | null>);

	return (
		<Box
			{...buttonProps}
			id={id}
			animated
			rcx-select
			ref={ref}
			is='button'
			display='flex'
			flexDirection='row'
			fontScale='p2'
			justifyContent='space-between'
			rcx-input-box--small={small}
			rcx-select--invalid={!!error}
			rcx-select--disabled={isDisabled}
		>
			{props.children}
		</Box>
	);
}
