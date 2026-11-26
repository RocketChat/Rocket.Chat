import type { ElementType } from 'react';

/** The element a tag name stands for; the web renders tag names as they are. */
export const resolveHost = (is: ElementType): ElementType => is;

/** The element that renders text; the web renders the tag name as it is. */
export const resolveTextHost = (is: ElementType): ElementType => is;
