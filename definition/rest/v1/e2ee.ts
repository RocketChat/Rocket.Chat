import type { E2EEKeyPair } from '../../../server/sdk/types/e2ee/E2EEKeyPair';
import type { IRoom } from '../../IRoom';
import type { ISubscription } from '../../ISubscription';
import type { IUser } from '../../IUser';

export type E2EEEndpoints = {
	'/v1/e2e.fetchMyKeys': {
		GET: () => {} | E2EEKeyPair;
	};

	'/v1/e2e.getUsersOfRoomWithoutKey': {
		GET: (params: { rid: IRoom['_id'] }) => {
			users: IUser[];
		};
	};

	/**
	 * @openapi
	 *  /api/v1/e2e.setRoomKeyID:
	 *    post:
	 *      description: Sets the end-to-end encryption key ID for a room
	 *      security:
	 *        - autenticated: {}
	 *      requestBody:
	 *        description: A tuple containing the room ID and the key ID
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              properties:
	 *                rid:
	 *                  type: string
	 *                keyID:
	 *                  type: string
	 *      responses:
	 *        200:
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
	'/v1/e2e.setRoomKeyID': {
		POST: (params: { rid: IRoom['_id']; keyID: Exclude<IRoom['e2eKeyId'], undefined> }) => void;
	};

	/**
	 * @openapi
	 *  /api/v1/e2e.setUserPublicAndPrivateKeys:
	 *    post:
	 *      description: Sets the end-to-end encryption keys for the authenticated user
	 *      security:
	 *        - autenticated: {}
	 *      requestBody:
	 *        description: A tuple containing the public and the private keys
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              properties:
	 *                public_key:
	 *                  type: string
	 *                private_key:
	 *                  type: string
	 *      responses:
	 *        200:
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
	'/v1/e2e.setUserPublicAndPrivateKeys': {
		POST: (params: {}) => void;
	};

	/**
	 * @openapi
	 *  /api/v1/e2e.updateGroupKey:
	 *    post:
	 *      description: Updates the end-to-end encryption key for a user on a room
	 *      security:
	 *        - autenticated: {}
	 *      requestBody:
	 *        description: A tuple containing the user ID, the room ID, and the key
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              properties:
	 *                uid:
	 *                  type: string
	 *                rid:
	 *                  type: string
	 *                key:
	 *                  type: string
	 *      responses:
	 *        200:
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
	'/v1/e2e.updateGroupKey': {
		POST: (params: {
			uid: IUser['_id'];
			rid: IRoom['_id'];
			key: Exclude<IRoom['e2eKeyId'], undefined>;
		}) => ISubscription | null;
	};

	'/v1/e2e.requestSubscriptionKeys': {
		POST: () => void;
	};

	'/v1/e2e.resetOwnE2EKey': {
		POST: () => boolean;
	};
};
