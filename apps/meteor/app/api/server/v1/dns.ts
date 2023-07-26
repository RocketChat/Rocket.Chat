import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../api';
import { resolveSRV, resolveTXT } from '../../../federation/server/functions/resolveDNS';
import { isErrnoException } from '../../../../server/lib/isErrnoException';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

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

			try {
				const resolved = await resolveSRV(url);

				return API.v1.success({ resolved });
			} catch (error: unknown) {
				if (isErrnoException(error)) {
					return API.v1.failure(error.message);
				}

				return API.v1.failure(String(error));
			}
		},
	},
);

/**
 * @openapi
 *  /api/v1/dns.resolve.txt:
 * 	  post:
 *      description: Resolves DNS text records (TXT records) for a hostname
 *      security:
 *        $ref: '#/security/authenticated'
 *      requestBody:
 *        content:
 *          application/json:
 *             description: The hostname
 *             required: true
 *            schema:
 *              type: object
 *              properties:
 *                url:
 *                  type: string
 *            example: |
 *              {
 *                 "url": "open.rocket.chat"
 *              }
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
			const params = { ...this.queryParams, ...this.bodyParams };
			check(
				params,
				Match.ObjectIncluding({
					url: String,
				}),
			);

			if (!this.bodyParams && this.queryParams) {
				apiDeprecationLogger.warn(
					'Using query parameters on the dns.resolve.txt endpoint is deprecated and will no longer be supported in the next major release of Rocket.Chat.',
				);
			}

			const { url } = params;
			if (!url) {
				throw new Meteor.Error('error-missing-param', 'The required "url" param is missing.');
			}

			try {
				const resolved = await resolveTXT(url.trim());

				return API.v1.success({ resolved });
			} catch (error: unknown) {
				if (isErrnoException(error)) {
					return API.v1.failure(error.message);
				}

				return API.v1.failure(String(error));
			}
		},
	},
);
