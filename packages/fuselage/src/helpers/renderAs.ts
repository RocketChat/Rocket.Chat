import { createElement, type ElementType } from 'react';

/** A Tamagui `render` element for `type`; Tamagui merges the frame's own props into it exactly once. */
export const renderAs = (type: ElementType, extraProps?: Record<string, unknown>) => createElement(type, extraProps);
