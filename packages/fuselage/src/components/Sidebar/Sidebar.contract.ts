import type { ReactNode } from 'react';

import type { ActionContract, CommonAttributes, PressEvents } from '../../types/Attributes.contract';
import type { ContainerAccessibilityAttributes, ContainerContract } from '../../types/Container.contract';

export type SidebarContract = ContainerContract;

export type SidebarSectionContract = ContainerContract;

export type SidebarFooterContract = ContainerContract;

export type SidebarFooterContentContract = ContainerContract;

export type SidebarMediaContract = ContainerContract;

export type SidebarMediaTitleContract = ContainerContract;

export type SidebarBannerVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type SidebarBannerContract = CommonAttributes &
	ContainerAccessibilityAttributes &
	PressEvents & {
		title?: ReactNode;
		variant?: SidebarBannerVariant;
		/** Renders the close button, which calls it when pressed. */
		onClose?: () => void;
		/** The accessible name of the close button. */
		closeLabel?: string;
		/** The banner's action: a `SidebarBannerLink` when it navigates, a `SidebarBannerButton` when it runs code. */
		children?: ReactNode;
		addon?: ReactNode;
	};

export type SidebarBannerActionContract = ActionContract & {
	children?: ReactNode;
};
