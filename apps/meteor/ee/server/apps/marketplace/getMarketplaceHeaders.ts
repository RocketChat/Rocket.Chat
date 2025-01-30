import { Info } from '../../../../app/utils/rocketchat.info';

export function getMarketplaceHeaders(): Record<string, any> {
	return {
		'X-Apps-Engine-Version': Info.marketplaceApiVersion.replace(/-.*/g, ''),
	};
}
