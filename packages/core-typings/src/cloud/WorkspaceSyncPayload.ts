import type * as UiKit from '@rocket.chat/ui-kit';
import * as z from 'zod';

import { IBannerSchema } from '../IBanner';
import { AnnouncementSchema } from './Announcement';
import { NpsSurveyAnnouncementSchema } from './NpsSurveyAnnouncement';
import { TimestampSchema } from '../utils';

export const WorkspaceSyncPayloadSchema = z.object({
	workspaceId: z.string(),
	publicKey: z.string().optional(),
	trial: z
		.object({
			trialing: z.boolean(),
			trialID: z.string(),
			endDate: TimestampSchema,
			marketing: z.object({
				utmContent: z.string(),
				utmMedium: z.string(),
				utmSource: z.string(),
				utmCampaign: z.string(),
			}),
			DowngradesToPlan: z.object({
				id: z.string(),
			}),
			trialRequested: z.boolean(),
		})
		.optional(),
	/** @deprecated */
	nps: NpsSurveyAnnouncementSchema.optional().meta({ deprecated: true }),
	/** @deprecated */
	banners: z.array(IBannerSchema).optional().meta({ deprecated: true }),
});

export type WorkspaceSyncPayload = z.infer<typeof WorkspaceSyncPayloadSchema>;

export type WorkspaceSyncRequestPayload = {
	uniqueId: string;
	workspaceId: string;
	seats: number;
	MAC: number; // Need to align on the property
	address: string;
	siteName: string;
	deploymentMethod: string;
	deploymentPlatform: string;
	version: string;
	licenseVersion: number;
	connectionDisable: boolean;
};

export const WorkspaceSyncResponseSchema = z.object({
	workspaceId: z.string(),
	publicKey: z.string().optional(),
	license: z.string(),
	removeLicense: z.boolean().optional(),
	cloudSyncAnnouncement: z.unknown(),
});

export type WorkspaceSyncResponse = z.infer<typeof WorkspaceSyncResponseSchema>;

export const WorkspaceCommsResponsePayloadSchema = z.object({
	workspaceId: z.string().optional(),
	publicKey: z.string().optional(),
	nps: NpsSurveyAnnouncementSchema.nullish(),
	announcements: z
		.object({
			create: z.array(AnnouncementSchema),
			delete: z.array(AnnouncementSchema.shape._id).optional(),
		})
		.optional(),
});

export type WorkspaceCommsResponsePayload = z.infer<typeof WorkspaceCommsResponsePayloadSchema>;

export type WorkspaceInteractionResponsePayload = {
	serverInteraction: UiKit.ServerInteraction;
	serverAction?: 'syncWorkspace';
};
