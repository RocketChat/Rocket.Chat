import * as banners from '../../../../client/lib/banners';

export const alerts = {
	open(config) {
		banners.open(config);
	},
	close() {
		banners.close();
	},
};
