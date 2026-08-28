/**
 * Pluggable providers: video conferencing and outbound communication.
 *
 * Legacy registers these through dedicated extend bundles
 * (`IVideoConfProvidersExtend`, `IOutboundCommunicationProviderExtend`) whose
 * provider objects take the positional accessor tuple. Here they are ordinary
 * definitions whose methods receive the unified `ctx`.
 */

import type { AppContext, AppEnv, BaseEnv } from './context';
import type { RoomId, UserId } from './models';

export interface VideoConfCall {
	readonly id: string;
	readonly room: RoomId;
	readonly createdBy: UserId;
	readonly title?: string;
}

export interface VideoConfProviderDef<Env extends AppEnv> {
	name: string;
	capabilities?: { mic?: boolean; cam?: boolean; title?: boolean; persistentChat?: boolean };
	/** Whether the provider has everything it needs (settings filled in, etc.). */
	isConfigured?(ctx: AppContext<Env>): Promise<boolean>;
	/** Produce the join URL for a call. */
	generateUrl(ctx: AppContext<Env> & { call: VideoConfCall }): Promise<string>;
	/** Customize the URL for a specific joining user. */
	customizeUrl?(ctx: AppContext<Env> & { call: VideoConfCall; user: UserId; url: string }): Promise<string>;
	onCallStarted?(ctx: AppContext<Env> & { call: VideoConfCall }): Promise<void>;
}

export const VIDEO_CONF_PROVIDER = Symbol.for('rc.app-sdk.videoConfProvider');
export type VideoConfProvider<Env extends AppEnv = AppEnv> = VideoConfProviderDef<Env> & { readonly [VIDEO_CONF_PROVIDER]: true };

export function defineVideoConfProvider<Env extends AppEnv = BaseEnv>(def: VideoConfProviderDef<Env>): VideoConfProvider<Env> {
	return { ...def, [VIDEO_CONF_PROVIDER]: true };
}

export interface OutboundMessage {
	to: string;
	templateId?: string;
	body?: string;
	variables?: Record<string, string>;
}

export interface OutboundProviderDef<Env extends AppEnv> {
	name: string;
	type: 'phone' | 'email';
	supportsTemplates?: boolean;
	documentationUrl?: string;
	send(ctx: AppContext<Env> & { message: OutboundMessage }): Promise<void>;
}

export const OUTBOUND_PROVIDER = Symbol.for('rc.app-sdk.outboundProvider');
export type OutboundProvider<Env extends AppEnv = AppEnv> = OutboundProviderDef<Env> & { readonly [OUTBOUND_PROVIDER]: true };

export function defineOutboundProvider<Env extends AppEnv = BaseEnv>(def: OutboundProviderDef<Env>): OutboundProvider<Env> {
	return { ...def, [OUTBOUND_PROVIDER]: true };
}
