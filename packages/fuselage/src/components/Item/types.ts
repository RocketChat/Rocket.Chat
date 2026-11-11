import type { ReactNode } from 'react';

import type { ActionAttributes } from '../../types/ElementAttributes';

export type ItemInset = 'none' | 'sm' | 'md' | 'lg';

/** What a part of an `Item` forwards to its element: the press handlers a row's content listens to, and the accessibility attributes. */
export type ItemPartAttributes = ActionAttributes<HTMLElement> & { children?: ReactNode };
