/// <reference types="vite/client" />
/** @internal */
import './index.css';

export * from './components';
export {
	backgroundColor,
	borderRadius,
	borderWidth,
	color,
	fontColor,
	fontFamily,
	fontScale,
	size,
	spacing,
	strokeColor,
	type BorderRadius,
	type BorderWidth,
	type FontScaleName,
} from './styleTokens';
export * from './contexts';
export { useStyle } from './hooks/useStyle';

export { Palette, __setThrowErrorOnInvalidToken__, Var } from './Theme';
