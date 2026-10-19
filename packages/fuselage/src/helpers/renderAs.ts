import { createElement, type ElementType } from 'react';

/** A Tamagui `render` function that renders `type`; Tamagui adds the frame's `className` to the returned element itself. */
export const renderAs =
	(type: ElementType, extraProps?: Record<string, unknown>) =>
	({ className: _className, ...props }: Record<string, unknown>) =>
		createElement(type, { ...props, ...extraProps });
