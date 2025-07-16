import { css } from '@rocket.chat/css-in-js';
import type { Box } from '@rocket.chat/fuselage';
import { Palette } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';

// TODO remove border from here
export function clickableItem<TProps extends Pick<ComponentPropsWithoutRef<typeof Box>, 'className' | 'tabIndex'>>(
	Component: ComponentType<TProps>,
) {
	const clickable = css`
		cursor: pointer;
		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
		border-bottom: 1px solid ${Palette.stroke['stroke-extra-light']} !important;
	`;
	const WrappedComponent = (props: TProps) => <Component className={clickable} tabIndex={0} {...props} />;

	WrappedComponent.displayName = `clickableItem(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}
