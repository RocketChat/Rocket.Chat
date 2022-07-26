import { memo, ReactElement } from 'react';

const toHexByte = (value: number): string => value.toString(16).padStart(2, '0');

type PreviewColorElementProps = {
	r: number;
	g: number;
	b: number;
	a: number;
};

const PreviewColorElement = ({ r, g, b, a }: PreviewColorElementProps): ReactElement => {
	if (a === 255) {
		return (
			<>
				#{toHexByte(r)}
				{toHexByte(g)}
				{toHexByte(b)}
			</>
		);
	}

	return (
		<>
			#{toHexByte(r)}
			{toHexByte(g)}
			{toHexByte(b)}
			{toHexByte(a)}
		</>
	);
};

export default memo(PreviewColorElement);
