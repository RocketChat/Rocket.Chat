import { Match, check } from 'meteor/check';
import { BannerPlatform } from '@rocket.chat/core-typings';

import { API } from '../api';
import { Banner } from '../../../../server/sdk';

/**
 * @deprecated
 * @openapi
 *  /api/v1/banners.getNew:
 *    get:
 *      description: Gets the banners to be shown to the authenticated user
 *      deprecated: true
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
 *        - name: bid
 *          in: query
 *          description: The id of a single banner
 *          required: false
 *          schema:
 *            type: string
 *          example: ByehQjC44FwMeiLbX
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
 *                           $ref: '#/components/schemas/IBanner'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'banners.getNew',
	{ authRequired: true },
	{
		// deprecated
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					platform: Match.OneOf(...Object.values(BannerPlatform)),
					bid: Match.Maybe(String),
				}),
			);

			const { platform, bid: bannerId } = this.queryParams;

			const banners = await Banner.getBannersForUser(this.userId, platform, bannerId ?? undefined);

			return API.v1.success({ banners });
		},
	},
);

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
	{ authRequired: true },
	{
		// TODO: move to users/:id/banners
		async get() {
			check(
				this.urlParams,
				Match.ObjectIncluding({
					id: Match.Where((id: unknown): id is string => typeof id === 'string' && Boolean(id.trim())),
				}),
			);
			check(
				this.queryParams,
				Match.ObjectIncluding({
					platform: Match.OneOf(...Object.values(BannerPlatform)),
				}),
			);

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
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'banners',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					platform: Match.OneOf(...Object.values(BannerPlatform)),
				}),
			);

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
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					bannerId: Match.Where((id: unknown): id is string => typeof id === 'string' && Boolean(id.trim())),
				}),
			);

			const { bannerId } = this.bodyParams;

			await Banner.dismiss(this.userId, bannerId);
			return API.v1.success();
		},
	},
);
