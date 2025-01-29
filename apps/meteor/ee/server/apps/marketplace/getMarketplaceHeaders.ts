import { Info } from '../../../../app/utils/rocketchat.info';

const appsEngineVersionForMarketplace = Info.marketplaceApiVersion.replace(/-.*/g, '');

export function getMarketplaceHeaders(): Record<string, any> {
	return {
		'X-Apps-Engine-Version': appsEngineVersionForMarketplace,
	};
}
