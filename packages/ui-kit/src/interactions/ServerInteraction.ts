import typia from 'typia';

import type { BannerView } from '../surfaces/banner';
import type { ContextualBarView } from '../surfaces/contextualBar';
import type { ModalView } from '../surfaces/modal';

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

export const isOpenModalServerInteraction = typia.createIs<OpenModalServerInteraction>();
export const isUpdateModalServerInteraction = typia.createIs<UpdateModalServerInteraction>();
export const isCloseModalServerInteraction = typia.createIs<CloseModalServerInteraction>();
export const isOpenBannerServerInteraction = typia.createIs<OpenBannerServerInteraction>();
export const isUpdateBannerServerInteraction = typia.createIs<UpdateBannerServerInteraction>();
export const isCloseBannerServerInteraction = typia.createIs<CloseBannerServerInteraction>();
export const isOpenContextualBarServerInteraction = typia.createIs<OpenContextualBarServerInteraction>();
export const isUpdateContextualBarServerInteraction = typia.createIs<UpdateContextualBarServerInteraction>();
export const isCloseContextualBarServerInteraction = typia.createIs<CloseContextualBarServerInteraction>();
export const isReportErrorsServerInteraction = typia.createIs<ReportErrorsServerInteraction>();

export const isServerInteraction = (input: unknown): input is ServerInteraction =>
	isOpenModalServerInteraction(input) ||
	isUpdateModalServerInteraction(input) ||
	isCloseModalServerInteraction(input) ||
	isOpenBannerServerInteraction(input) ||
	isUpdateBannerServerInteraction(input) ||
	isCloseBannerServerInteraction(input) ||
	isOpenContextualBarServerInteraction(input) ||
	isUpdateContextualBarServerInteraction(input) ||
	isCloseContextualBarServerInteraction(input) ||
	isReportErrorsServerInteraction(input);
