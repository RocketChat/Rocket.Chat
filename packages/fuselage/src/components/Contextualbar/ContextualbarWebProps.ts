import type { Ref } from 'react';

import type {
	ContextualbarContentContract,
	ContextualbarContract,
	ContextualbarFooterContract,
	ContextualbarHeaderContract,
	ContextualbarSectionContract,
	ContextualbarSkeletonContentContract,
	ContextualbarTitleContract,
} from './Contextualbar.contract';
import type { WebInteractionHandlers } from '../../helpers/pickWebInteractionHandlers';
import type { WebDivPressAlias, WebProps } from '../../types/WebAttributes';

// The bar and its content take a ref to any element, which a div, being one, can safely receive
export const divRef = (ref: Ref<HTMLElement> | undefined) => ref as Ref<HTMLDivElement> | undefined;

type Titled = { title?: string };

export type WebContextualbarProps = WebProps<ContextualbarContract, HTMLElement> &
	WebDivPressAlias &
	WebInteractionHandlers<HTMLDivElement> &
	Titled;

export type WebContextualbarHeaderProps = WebProps<ContextualbarHeaderContract, HTMLDivElement> & Titled;

export type WebContextualbarContentProps = WebProps<ContextualbarContentContract, HTMLElement> & Titled;

export type WebContextualbarSectionProps = WebProps<ContextualbarSectionContract, HTMLDivElement> & Titled;

export type WebContextualbarFooterProps = WebProps<ContextualbarFooterContract, HTMLDivElement> & Titled;

export type WebContextualbarTitleProps = WebProps<ContextualbarTitleContract, HTMLHeadingElement> & Titled;

export type WebContextualbarSkeletonContentProps = WebProps<ContextualbarSkeletonContentContract, HTMLDivElement>;
