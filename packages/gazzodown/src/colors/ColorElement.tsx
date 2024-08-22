import { memo, ReactElement } from 'react';

type ColorElementProps = {
	r: number;
	g: number;
	b: number;
	a: number;
};

const ColorElement = ({ r, g, b, a }: ColorElementProps): ReactElement => (
	<span>
		<span
			style={{
				backgroundColor: `rgba(${r}, ${g}, ${b}, ${(a / 255) * 100}%)`,
				display: 'inline-block',
				width: '1em',
				height: '1em',
				verticalAlign: 'middle',
				marginInlineEnd: '0.5em',
			}}
		/>
		rgba({r}, {g}, {b}, {(a / 255) * 100}%)
	</span>
);

export default memo(ColorElement);
