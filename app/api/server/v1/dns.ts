import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../api';
import { resolveSRV, resolveTXT } from '../../../federation/server/functions/resolveDNS';

/**
 * @openapi
 *  /api/v1/dns.resolve.srv:
 * 	  get:
 *      description: Resolves DNS service records (SRV records) for a hostname
 *      security:
 *        $ref: '#/security/authenticated'
 *      parameters:
 *        - name: url
 *          in: query
 *          description: The hostname
 *          required: true
 *          schema:
 *            type: string
 *          example: open.rocket.chat
 *      responses:
 *        200:
 *          description: The resolved records
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      resolved:
 *                        type: object
 *                        properties:
 *                          target:
 *                            type: string
 *                          priority:
 *                            type: number
 *                          weight:
 *                            type: number
 *                          port:
 *                            type: number
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'dns.resolve.srv',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					url: String,
				}),
			);

			const { url } = this.queryParams;
			if (!url) {
				throw new Meteor.Error('error-missing-param', 'The required "url" param is missing.');
			}

			const resolved = await resolveSRV(url);

			return API.v1.success({ resolved });
		},
	},
);

/**
 * @openapi
 *  /api/v1/dns.resolve.txt:
 * 	  get:
 *      description: Resolves DNS text records (TXT records) for a hostname
 *      security:
 *        $ref: '#/security/authenticated'
 *      parameters:
 *        - name: url
 *          in: query
 *          description: The hostname
 *          required: true
 *          schema:
 *            type: string
 *          example: open.rocket.chat
 *      responses:
 *        200:
 *          description: The resolved records
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      resolved:
 *                        type: string
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'dns.resolve.txt',
	{ authRequired: true },
	{
		async post() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					url: String,
				}),
			);

			const { url } = this.queryParams;
			if (!url) {
				throw new Meteor.Error('error-missing-param', 'The required "url" param is missing.');
			}

			const resolved = await resolveTXT(url);

			return API.v1.success({ resolved });
		},
	},
);
