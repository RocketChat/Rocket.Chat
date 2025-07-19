


import QRCode from 'qrcode';
import crypto from 'crypto';
import { generateJWT } from '/app/utils/server/lib/JWTHelper';
import { API } from '../api';
//Doesnt work here
API.v1.addRoute(
	'qrcode.generate',
	{
		authRequired: false,
	},
	{
		async post() {
			const uuid = `${crypto.randomUUID()}-${this.bodyParams.sessionId}`;
			const finalDataToEncode = generateJWT({ context: { clientAddress: this.bodyParams.sessionId, uuid } }, process.env.JWT_SECRET || 'defaultSecret', 60);
			const qrCodeUrl = await QRCode.toDataURL(finalDataToEncode, {
				width: 256,
				margin: 2,
				color: { dark: '#1f2329', light: '#ffffff' },
				errorCorrectionLevel: 'M',
				type: 'image/png',
			});
			return API.v1.success(qrCodeUrl);
		},
	})