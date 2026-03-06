import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';
import { Banner } from '@rocket.chat/core-services';
import {
	isBannersDismissProps,
	isBannersProps,
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

/**
 * @openapi
 *  /api/v1/banners/{id}:
 *    get:
 *      description: Gets the banner to be shown to the authenticated user
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
 *        - name: id
 *          in: path
 *          description: The id of the banner
 *          required: true
 *          schema:
 *            type: string
 *          example: ByehQjC44FwMeiLbX
 *      responses:
 *        200:
 *          description: |
 *            A collection with a single banner matching the criteria; an empty
 *            collection otherwise
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
	'banners/:id',
	{ authRequired: true, validateParams: isBannersProps },
	{
		// TODO: move to users/:id/banners
		async get() {
			const { platform } = this.queryParams;
			const { id } = this.urlParams;

			const banners = await Banner.getBannersForUser(this.userId, platform, id);

			return API.v1.success({ banners });
		},
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
 *        400:
 *          description: Bad request
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 *        401:
 *          description: Unauthorized
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
const bannersEndpoints = API.v1.get(
	'banners',
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
			200: ajv.compile<{ banners: IBanner[]; success: true }>({
				type: 'object',
				properties: {
					banners: {
						type: 'array',
						items: { type: 'object' },
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
		const { platform } = this.queryParams;

		const banners = await Banner.getBannersForUser(this.userId, platform);

		return API.v1.success({ banners });
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

type BannersGetEndpoints = ExtractRoutesFromAPI<typeof bannersEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends BannersGetEndpoints {}
}
