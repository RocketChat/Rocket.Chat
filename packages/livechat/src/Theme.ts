import { type CSSProperties } from 'preact/compat';

export type Theme = {
	color: CSSProperties['backgroundColor'];
	fontColor: CSSProperties['color'];
};
