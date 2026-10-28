/* eslint-disable react/no-multi-comp, no-nested-ternary -- one probe per use-site shape the zero compiler is asked to lower */
import { styled, View } from '@tamagui/web';
import type { ReactNode, Ref } from 'react';

const LocalFrame = styled(View, {
	render: 'button',
	backgroundColor: 'red',
	hoverStyle: { backgroundColor: 'blue' },
	variants: {
		look: {
			primary: { backgroundColor: 'green' },
			secondary: { backgroundColor: 'gray' },
			danger: { backgroundColor: 'orange' },
		},
		big: { true: { height: 48 } },
	} as const,
});

type ProbeProps = {
	variant?: 'primary' | 'secondary' | 'danger';
	big?: boolean;
	className?: string;
	onClick?: () => void;
	ref?: Ref<HTMLButtonElement>;
	children?: ReactNode;
	disabled?: boolean;
	rest?: Record<string, unknown>;
};

export const P1 = () => <LocalFrame>p1</LocalFrame>;
export const P2 = ({ className }: ProbeProps) => <LocalFrame className={className}>p2</LocalFrame>;
export const P3 = ({ onClick }: ProbeProps) => <LocalFrame onClick={onClick}>p3</LocalFrame>;
export const P4 = ({ ref }: ProbeProps) => <LocalFrame ref={ref as any}>p4</LocalFrame>;
export const P5 = ({ variant }: ProbeProps) => (
	<LocalFrame look={variant === 'primary' ? 'primary' : variant === 'danger' ? 'danger' : 'secondary'}>p5</LocalFrame>
);
export const P6 = ({ big }: ProbeProps) => <LocalFrame big={big}>p6</LocalFrame>;
export const P7 = ({ disabled }: ProbeProps) => <LocalFrame disabled={disabled}>p7</LocalFrame>;
export const P8 = ({ children }: ProbeProps) => <LocalFrame>{children}</LocalFrame>;
export const P9 = ({ rest }: ProbeProps) => <LocalFrame render={<button {...rest} />}>p9</LocalFrame>;
export const P10 = () => <LocalFrame look='danger'>p10</LocalFrame>;

export const P12 = ({ variant }: ProbeProps) => <LocalFrame look={variant}>p12</LocalFrame>;
export const P13 = ({ variant, disabled }: ProbeProps) => <LocalFrame look={disabled ? 'secondary' : variant}>p13</LocalFrame>;
export const P15 = ({ rest }: ProbeProps) => <LocalFrame style={rest}>p15</LocalFrame>;
export const P16 = ({ className }: ProbeProps) => <LocalFrame height={className}>p16</LocalFrame>;
export const P17 = ({ rest, ref }: ProbeProps) => <LocalFrame render={<button {...rest} ref={ref} />}>p17</LocalFrame>;
export const P14 = ({ rest, className }: ProbeProps) => (
	<LocalFrame render={<a {...rest} />} className={className}>
		p14
	</LocalFrame>
);
