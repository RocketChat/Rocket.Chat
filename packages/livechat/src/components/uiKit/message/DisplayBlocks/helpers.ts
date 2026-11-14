import * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';

import styles from './styles.module.scss';
import { createClassName } from '../../../../helpers/createClassName';

export type Parser = uikit.SurfaceRenderer<ComponentChild>;

export const cx = (name: string, modifiers = {}) => createClassName(styles, name, modifiers);

export const safeUrl = (url?: string) => (url && uikit.isSafeUrl(url) ? url : undefined);
