import { expect } from 'chai';

import { BeforeSaveSpotify } from '../../../../../../server/services/messages/hooks/BeforeSaveSpotify';

const createMessage = (msg?: string, extra: any = {}) => ({
	_id: 'random',
	rid: 'GENERAL',
	ts: new Date(),
	u: {
		_id: 'userId',
		username: 'username',
	},
	_updatedAt: new Date(),
	msg: msg as string,
	...extra,
});

describe('Convert Spotify syntax to URLs', () => {
	it('should return no URLs if no Spotify syntax provided', async () => {
		const spotify = new BeforeSaveSpotify();

		const message = await spotify.convertSpotifyLinks({
			message: createMessage('hey'),
		});

		return expect(message).to.not.have.property('urls');
	});

	it('should return no URLs if an undefined message is provided', async () => {
		const spotify = new BeforeSaveSpotify();

		const message = await spotify.convertSpotifyLinks({
			message: createMessage(),
		});

		return expect(message).to.not.have.property('urls');
	});

	it('should not return a Spotify URL if some Spotify syntax is provided within a code block', async () => {
		const spotify = new BeforeSaveSpotify();

		const message = await spotify.convertSpotifyLinks({
			message: createMessage('test\n```\nspotify:track:1q6IK1l4qpYykOaWaLJkWG\n```'),
		});

		return expect(message).to.not.have.property('urls');
	});

	it('should not return a Spotify URL if some Spotify syntax is provided within a inline code', async () => {
		const spotify = new BeforeSaveSpotify();

		const message = await spotify.convertSpotifyLinks({
			message: createMessage('test `spotify:track:1q6IK1l4qpYykOaWaLJkWG` ok'),
		});

		return expect(message).to.not.have.property('urls');
	});

	it('should return a Spotify URL if some Spotify syntax is provided', async () => {
		const spotify = new BeforeSaveSpotify();

		const message = await spotify.convertSpotifyLinks({
			message: createMessage('spotify:track:1q6IK1l4qpYykOaWaLJkWG'),
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(1);

		const [url] = message.urls ?? [];

		expect(url).to.have.property('url', 'https://open.spotify.com/track/1q6IK1l4qpYykOaWaLJkWG');
		expect(url).to.have.property('source', 'spotify:track:1q6IK1l4qpYykOaWaLJkWG');
	});

	it('should append a Spotify URL when Spotify syntax is provided with already existing URLs', async () => {
		const spotify = new BeforeSaveSpotify();

		const message = await spotify.convertSpotifyLinks({
			message: createMessage('spotify:track:1q6IK1l4qpYykOaWaLJkWG', {
				urls: [{ url: 'https://rocket.chat' }],
			}),
		});

		expect(message).to.have.property('urls').and.to.have.lengthOf(2);

		const [url1, url2] = message.urls ?? [];

		expect(url1).to.have.property('url', 'https://rocket.chat');

		expect(url2).to.have.property('url', 'https://open.spotify.com/track/1q6IK1l4qpYykOaWaLJkWG');
		expect(url2).to.have.property('source', 'spotify:track:1q6IK1l4qpYykOaWaLJkWG');
	});
});
