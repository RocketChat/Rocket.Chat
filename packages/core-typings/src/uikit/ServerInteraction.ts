import type { BannerView } from './BannerView';
import type { ContextualBarView } from './ContextualBarView';
import type { ModalView } from './ModalView';

type OpenModalServerInteraction = {
	type: 'modal.open';
	triggerId: string;
	appId: string;
	view: ModalView;
};

type UpdateModalServerInteraction = {
	type: 'modal.update';
	triggerId: string;
	appId: string;
	view: ModalView;
};

type CloseModalServerInteraction = {
	type: 'modal.close';
	triggerId: string;
	appId: string;
	viewId: ModalView['id'];
};

type OpenBannerServerInteraction = {
	type: 'banner.open';
	triggerId: string;
	appId: string;
} & BannerView;

type UpdateBannerServerInteraction = {
	type: 'banner.update';
	triggerId: string;
	appId: string;
	view: BannerView;
};

type CloseBannerServerInteraction = {
	type: 'banner.close';
	triggerId: string;
	appId: string;
	viewId: BannerView['viewId'];
};

type OpenContextualBarServerInteraction = {
	type: 'contextual_bar.open';
	triggerId: string;
	appId: string;
	view: ContextualBarView;
};

type UpdateContextualBarServerInteraction = {
	type: 'contextual_bar.update';
	triggerId: string;
	appId: string;
	view: ContextualBarView;
};

type CloseContextualBarServerInteraction = {
	type: 'contextual_bar.close';
	triggerId: string;
	appId: string;
	view: ContextualBarView;
};

type ReportErrorsServerInteraction = {
	type: 'errors';
	triggerId: string;
	appId: string;
	viewId: ModalView['id'] | BannerView['viewId'] | ContextualBarView['id'];
	errors: { [field: string]: string }[];
};

export type ServerInteraction =
	| OpenModalServerInteraction
	| UpdateModalServerInteraction
	| CloseModalServerInteraction
	| OpenBannerServerInteraction
	| UpdateBannerServerInteraction
	| CloseBannerServerInteraction
	| OpenContextualBarServerInteraction
	| UpdateContextualBarServerInteraction
	| CloseContextualBarServerInteraction
	| ReportErrorsServerInteraction;
