import type { LabelHTMLAttributes, OutputHTMLAttributes } from 'react';
import type { SliderState } from 'react-stately';

import { Label } from '../Label';

type SliderHeadProps = {
	state: SliderState;
	labelProps: Omit<LabelHTMLAttributes<HTMLLabelElement>, 'is'>;
	outputProps: Omit<OutputHTMLAttributes<HTMLOutputElement>, 'is'>;
	label?: string;
	showOutput?: boolean;
	multiThumb?: boolean;
};
export const SliderHead = ({ state, labelProps, outputProps, label, showOutput = true, multiThumb }: SliderHeadProps) => {
	const output = (
		<Label {...(outputProps as any)}>
			{multiThumb ? (
				<Label {...outputProps} data-testid='slider-output'>
					{`${state.getThumbValueLabel(0)} - ${state.getThumbValueLabel(1)}`}
				</Label>
			) : (
				<Label {...outputProps} data-testid='slider-output'>
					{state.getThumbValueLabel(0)}
				</Label>
			)}
		</Label>
	);
	return (
		<>
			{label ? (
				<div className={`rcx-slider__head rcx-slider__head--${state.orientation}`}>
					<Label {...labelProps}>{label}</Label>
					{showOutput && output}
				</div>
			) : (
				showOutput && output
			)}
		</>
	);
};
