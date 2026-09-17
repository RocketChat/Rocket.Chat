import { Banner } from '@rocket.chat/core-services';
import type { IBanner } from '@rocket.chat/core-typings';
import {
	ajv,
	isBannersDismissProps,
	isBannersProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../api';

const bannersResponseSchema = ajv.compile<{ banners: IBanner[] }>({
	type: 'object',
	properties: {
		banners: { type: 'array', items: { $ref: '#/components/schemas/IBanner' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['banners', 'success'],
	additionalProperties: false,
});

const dismissResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

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
API.v1.get(
	'banners/:id',
	{
		authRequired: true,
		query: isBannersProps,
		response: {
			200: bannersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { platform } = this.queryParams;
		const { id } = this.urlParams;

		const banners = await Banner.getBannersForUser(this.userId, platform, id);

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
API.v1.get(
	'banners',
	{
		authRequired: true,
		query: isBannersProps,
		response: {
			200: bannersResponseSchema,
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
API.v1.post(
	'banners.dismiss',
	{
		authRequired: true,
		body: isBannersDismissProps,
		response: {
			200: dismissResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { bannerId } = this.bodyParams;

		await Banner.dismiss(this.userId, bannerId);
		return API.v1.success();
	},
);
