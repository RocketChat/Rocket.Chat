import type { ReactElement } from 'react';
import { memo } from 'react';

type ComposerColorElementProps = {
	r: number;
	g: number;
	b: number;
	a: number;
};

const ComposerColorElement = ({ r, g, b, a }: ComposerColorElementProps): ReactElement => (
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

export default memo(ComposerColorElement);
