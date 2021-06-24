import { Base } from './_Base';

class OEmbed extends Base {
	constructor() {
		super('oembed');

		this.tryEnsureIndex({ endPoint: 1 });
	}

	// find one
	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	// find
	findByEndPoint(endPoint, options) {
		return this.find({ endPoint }, options);
	}

	findByEndPointExceptId(endPoint, except, options) {
		const query = {
			_id: { $nin: [except] },
			endPoint,
		};

		return this.find(query, options);
	}


	// update
	setUrls(_id, urls) {
		const update = {
			$set: {
				urls,
			},
		};

		return this.update({ _id }, update);
	}

	setEndPoint(_id, endPoint) {
		const update = {
			$set: {
				endPoint,
			},
		};

		return this.update({ _id }, update);
	}

	// insert
	create(data) {
		return this.insert(data);
	}


	// remove
	removeById(_id) {
		return this.remove(_id);
	}

	// reload preloaded
	reloadPreloaded(preloaded) {
		this.find({ preloaded: true }).fetch().forEach((o) => { this.removeById(o._id); });
		preloaded.forEach((p) => {
			p.preloaded = true;
			this.create(p);
		});
	}
}

const oembed = new OEmbed();

const ps = [
	{
		urls: [new RegExp('https?://soundcloud\\.com/\\S+')],
		endPoint: 'https://soundcloud.com/oembed?format=json&maxheight=150',
	},
	{
		urls: [new RegExp('https?://vimeo\\.com/[^/]+'), new RegExp('https?://vimeo\\.com/channels/[^/]+/[^/]+'), new RegExp('https://vimeo\\.com/groups/[^/]+/videos/[^/]+')],
		endPoint: 'https://vimeo.com/api/oembed.json?maxheight=200',
	},
	{
		urls: [new RegExp('https?://www\\.youtube\\.com/\\S+'), new RegExp('https?://youtu\\.be/\\S+')],
		endPoint: 'https://www.youtube.com/oembed?maxheight=200',
	},
	{
		urls: [new RegExp('https?://www\\.rdio\\.com/\\S+'), new RegExp('https?://rd\\.io/\\S+')],
		endPoint: 'https://www.rdio.com/api/oembed/?format=json&maxheight=150',
	},
	{
		urls: [new RegExp('https?://www\\.slideshare\\.net/[^/]+/[^/]+')],
		endPoint: 'https://www.slideshare.net/api/oembed/2?format=json&maxheight=200',
	},
	{
		urls: [new RegExp('https?://www\\.dailymotion\\.com/video/\\S+')],
		endPoint: 'https://www.dailymotion.com/services/oembed?maxheight=200',
	},
];
oembed.reloadPreloaded(ps);

export default oembed;
