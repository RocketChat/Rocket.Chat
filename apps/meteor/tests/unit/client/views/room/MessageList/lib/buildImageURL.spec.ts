import { expect } from 'chai';

import { buildImageURL } from '../../../../../../../client/views/room/MessageList/components/UrlPreview/PreviewList';

describe('buildImageURL', () => {
	const testCases = [
		[
			'https://g1.globo.com/mundo/video/misseis-atingem-ponte-de-vidro-em-kiev-11012523.ghtml',
			'https://s2.glbimg.com/fXQKM_UZjF6I_3APIbPJzJTOUvw=/1200x/smart/filters:cover():strip_icc()/s04.video.glbimg.com/x720/11012523.jpg',
			'https://s2.glbimg.com/fXQKM_UZjF6I_3APIbPJzJTOUvw=/1200x/smart/filters:cover():strip_icc()/s04.video.glbimg.com/x720/11012523.jpg',
		],
		['https://open.rocket.chat/channel/general', 'assets/favicon_512.png', 'https://open.rocket.chat/assets/favicon_512.png'],
		['https://open.rocket.chat/channel/general', '/assets/favicon_512.png', 'https://open.rocket.chat/assets/favicon_512.png'],
		['https://open.rocket.chat/channel/general/', '/assets/favicon_512.png', 'https://open.rocket.chat/assets/favicon_512.png'],
	] as const;

	testCases.forEach(([linkUrl, metaImgUrl, expectedResult]) => {
		it(`should return ${expectedResult} for ${metaImgUrl}`, () => {
			const result = buildImageURL(linkUrl, metaImgUrl);

			expect(result).to.equal(JSON.stringify(expectedResult));
		});
	});
});
