import { css } from '@rocket.chat/css-in-js';

import { statusColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius } from '../../styleTokens';
import { Icon, type IconProps } from '../Icon';

export type StatesIconProps = {
	variation?: 'danger' | 'success' | 'warning' | 'primary';
} & IconProps;

const variationColors = {
	success: toCSSValue('--rcx-states-icons-color-success', statusColors['status-font-on-success']),
	danger: toCSSValue('--rcx-states-icons-color-danger', statusColors['status-font-on-danger']),
	warning: toCSSValue('--rcx-states-icons-color-warning', statusColors['status-font-on-warning']),
	primary: toCSSValue('--rcx-states-icons-color-primary', statusColors['status-font-on-info']),
};

// `Icon` renders its own frame, so its look comes in as a class
const iconStyle = (variation: StatesIconProps['variation']) => css`
	margin-block-end: 1.25rem;
	padding: 1rem;
	color: ${variation ? variationColors[variation] : textIconColors['font-secondary-info']};
	border-radius: ${toCSSValue('--rcx-border-radius-full', borderRadius('full'))};
	background-color: ${surfaceColors['surface-neutral']};
`;

const StatesIcon = ({ variation, className, ...props }: StatesIconProps) => (
	<Icon
		{...props}
		className={[
			'rcx-states__icon',
			variation && `rcx-states__icon--${variation}`,
			iconStyle(variation),
			...(Array.isArray(className) ? className : [className]),
		]}
		size='x32'
	/>
);

export default StatesIcon;
