import type { StylingProps } from './stylingProps.js';
import { extractStylingProps } from './stylingProps.js';
import { appendClassName } from '../../helpers/appendClassName.js';
import { useStyle } from '../../hooks/useStyle.js';

export const useStylingProps = <TProps extends { className?: string }>(originalProps: TProps): Omit<TProps, keyof StylingProps> => {
	const [props, styles] = extractStylingProps(originalProps);

	const newClassName = useStyle(styles, undefined);

	if (newClassName) {
		props.className = props.className ? appendClassName(props.className, newClassName) : newClassName;
	}

	return props;
};
