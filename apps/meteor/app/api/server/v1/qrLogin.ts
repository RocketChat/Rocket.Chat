import { Meteor } from 'meteor/meteor';
import { QrLoginTokens } from '../../../authentication/server/services/QrLoginService';
import { API } from '../api';

type QRLoginBodyParams = {
    userId: string;
};

API.v1.addRoute(
    'login/qr/:token',
    { authRequired: false },
    {
        async post(this: {
            bodyParams: QRLoginBodyParams;
            urlParams: { token: string };
            queryParams: Record<string, string>;
        }) {
            const { userId } = this.bodyParams;
            const { token } = this.urlParams;

            if (!userId) {
                throw new Meteor.Error('user-id-required', 'User ID is required');
            }

            const qrToken = await QrLoginTokens.findOneAsync({
                token,
                status: 'pending',
                expiresAt: { $gt: new Date() }
            });

            if (!qrToken) {
                throw new Meteor.Error('invalid-token', 'Invalid or expired QR token');
            }

            await QrLoginTokens.updateAsync(
                { _id: qrToken._id },
                { $set: { status: 'scanned', userId } }
            );

            return API.v1.success({
                status: 'validated',
                token,
                userId
            });
        }
    }
);