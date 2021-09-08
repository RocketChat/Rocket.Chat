// import { callbacks } from '../../../app/callbacks/server';
// import { onLicense } from '../../app/license/server';
// import { Logger } from '../../../app/logger';
// import { fromTemplate } from '../../../app/custom-oauth/server/transform_helpers';


// onLicense('oAuth-enterprise', () => {
// 	callbacks.add('SAML-avatarSync', ({ avatarField: string, data: any }) => {
// 		try {
// 			const value = fromTemplate(avatarField, data);
// 			console.log(`get avatar url: ${ value }`);
// 			if (!value) {
// 				Logger.debug(`Avatar field "${ avatarField }" not found in data`, data);
// 			}
// 			return value;
// 		} catch (error) {
// 			throw new Error('CustomOAuth: Failed to extract avatar url', error.message);
// 		}
// 	});
// });
