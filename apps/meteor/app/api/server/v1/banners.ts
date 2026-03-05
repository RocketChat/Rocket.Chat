import { Banner } from '@rocket.chat/core-services';
import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';
import {
	ajv,
	isBannersDismissProps,
	isBannersProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const bannersIdEndpoints = API.v1.get(
	'banners/:id',
	{
		authRequired: true,
		query: ajv.compile<{ platform: BannerPlatform }>({
			type: 'object',
			properties: {
				platform: {
					type: 'string',
					enum: ['web', 'mobile'],
				},
			},
			required: ['platform'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ banners: IBanner[] }>({
				type: 'object',
				properties: {
					banners: {
						type: 'array',
						items: {
							type: 'object',
						},
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['banners', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		// TODO: move to users/:id/banners
		const { platform } = this.queryParams;
		const { id } = this.urlParams;

		const banners = await Banner.getBannersForUser(this.userId, platform as BannerPlatform, id);

		return API.v1.success({ banners });
	},
);

/**
 * @openapi
 *  /api/v1/banners:
 *    get:
 *      description: Gets the banners to be shown to the authenticated user
 *      security:
 *        $ref: '#/security/authenticated'
 *      parameters:
 *        - name: platform
 *          in: query
 *          description: The platform rendering the banner
 *          required: true
 *          schema:
 *            type: string
 *            enum: [web, mobile]
 *          example: web
 *      responses:
 *        200:
 *          description: The banners matching the criteria
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      banners:
 *                        type: array
 *                        items:
 *                          $ref: '#/components/schemas/IBanner'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'banners',
	{ authRequired: true, validateParams: isBannersProps },
	{
		async get() {
			const { platform } = this.queryParams;

			const banners = await Banner.getBannersForUser(this.userId, platform);

			return API.v1.success({ banners });
		},
	},
);

/**
 * @openapi
 *  /api/v1/banners.dismiss:
 *    post:
 *      description: Dismisses a banner
 *      security:
 *        $ref: '#/security/authenticated'
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                bannerId:
 *                  type: string
 *            example: |
 *              {
 *                 "bannerId": "ByehQjC44FwMeiLbX"
 *              }
 *      responses:
 *        200:
 *          description: The banners matching the criteria
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessV1'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'banners.dismiss',
	{ authRequired: true, validateParams: isBannersDismissProps },
	{
		async post() {
			const { bannerId } = this.bodyParams;

			await Banner.dismiss(this.userId, bannerId);
			return API.v1.success();
		},
	},
);

export type BannersIdEndpoints = ExtractRoutesFromAPI<typeof bannersIdEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends BannersIdEndpoints {}
}
