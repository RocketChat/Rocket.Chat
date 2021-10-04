import { Promise } from 'meteor/promise';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../api';
import { Banner } from '../../../../server/sdk';
import { BannerPlatform } from '../../../../definition/IBanner';

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
 *                           ref: '#/components/schemas/IBanner'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute('banners.getNew', { authRequired: true }, { // deprecated
	get() {
		check(this.queryParams, Match.ObjectIncluding({
			platform: String,
			bid: Match.Maybe(String),
		}));

		const { platform, bid: bannerId } = this.queryParams;
		if (!platform) {
			throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
		}

		if (!Object.values(BannerPlatform).includes(platform)) {
			throw new Meteor.Error('error-unknown-platform', 'Platform is unknown.');
		}

		const banners = Promise.await(Banner.getBannersForUser(this.userId, platform, bannerId));

		return API.v1.success({ banners });
	},
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
API.v1.addRoute('banners/:id', { authRequired: true }, {
	get() {
		check(this.urlParams, Match.ObjectIncluding({
			id: String,
		}));

		const { platform } = this.queryParams;
		if (!platform) {
			throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
		}

		const { id } = this.urlParams;
		if (!id) {
			throw new Meteor.Error('error-missing-param', 'The required "id" param is missing.');
		}

		const banners = Promise.await(Banner.getBannersForUser(this.userId, platform, id));

		return API.v1.success({ banners });
	},
});

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
API.v1.addRoute('banners', { authRequired: true }, {
	get() {
		check(this.queryParams, Match.ObjectIncluding({
			platform: String,
		}));

		const { platform } = this.queryParams;
		if (!platform) {
			throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
		}

		if (!Object.values(BannerPlatform).includes(platform)) {
			throw new Meteor.Error('error-unknown-platform', 'Platform is unknown.');
		}

		const banners = Promise.await(Banner.getBannersForUser(this.userId, platform));

		return API.v1.success({ banners });
	},
});

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
API.v1.addRoute('banners.dismiss', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			bannerId: String,
		}));

		const { bannerId } = this.bodyParams;

		if (!bannerId || !bannerId.trim()) {
			throw new Meteor.Error('error-missing-param', 'The required "bannerId" param is missing.');
		}

		Promise.await(Banner.dismiss(this.userId, bannerId));
		return API.v1.success();
	},
});
