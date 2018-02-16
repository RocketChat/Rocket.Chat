import _ from 'underscore';

RocketChat.API.v1.addRoute('info', { authRequired: false }, {
	get() {
		const user = this.getLoggedInUser();

		if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
			return RocketChat.API.v1.success({
				info: RocketChat.Info
			});
		}

		return RocketChat.API.v1.success({
			info: {
				'version': RocketChat.Info.version
			}
		});
	}
});

RocketChat.API.v1.addRoute('me', { authRequired: true }, {
	get() {
		const me = _.pick(this.user, [
			'_id',
			'name',
			'emails',
			'status',
			'statusConnection',
			'username',
			'utcOffset',
			'active',
			'language'
		]);

		const verifiedEmail = me.emails.find((email) => email.verified);

		me.email = verifiedEmail ? verifiedEmail.address : undefined;

		return RocketChat.API.v1.success(me);
	}
});

let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute
RocketChat.API.v1.addRoute('shield.svg', { authRequired: false }, {
	get() {
		const { type, channel, name, icon } = this.queryParams;
		if (!RocketChat.settings.get('API_Enable_Shields')) {
			throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', { route: '/api/v1/shields.svg' });
		}
		const types = RocketChat.settings.get('API_Shield_Types');
		if (type && (types !== '*' && !types.split(',').map((t) => t.trim()).includes(type))) {
			throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', { route: '/api/v1/shields.svg' });
		}
		const hideIcon = icon === 'false';
		if (hideIcon && (!name || !name.trim())) {
			return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
		}
		let text;
		switch (type) {
			case 'online':
				if (Date.now() - onlineCacheDate > cacheInvalid) {
					onlineCache = RocketChat.models.Users.findUsersNotOffline().count();
					onlineCacheDate = Date.now();
				}
				text = `${ onlineCache } ${ TAPi18n.__('Online') }`;
				break;
			case 'channel':
				if (!channel) {
					return RocketChat.API.v1.failure('Shield channel is required for type "channel"');
				}
				text = `#${ channel }`;
				break;
			default:
				text = TAPi18n.__('Join_Chat').toUpperCase();
		}
		const iconSize = hideIcon ? 7 : 24;
		const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
		const rightSize = text.length * 6 + 20;
		const width = leftSize + rightSize;
		const height = 20;
		return {
			headers: { 'Content-Type': 'image/svg+xml;charset=utf-8' },
			body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${ width }" height="${ height }">
				  <linearGradient id="b" x2="0" y2="100%">
				    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
				    <stop offset="1" stop-opacity=".1"/>
				  </linearGradient>
				  <mask id="a">
				    <rect width="${ width }" height="${ height }" rx="3" fill="#fff"/>
				  </mask>
				  <g mask="url(#a)">
				    <path fill="#555" d="M0 0h${ leftSize }v${ height }H0z"/>
				    <path fill="#4c1" d="M${ leftSize } 0h${ rightSize }v${ height }H${ leftSize }z"/>
				    <path fill="url(#b)" d="M0 0h${ width }v${ height }H0z"/>
				  </g>
				    ${ hideIcon ? '' : '<image x="5" y="3" width="14" height="14" xlink:href="/assets/favicon.svg"/>' }
				  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${ name ? `<text x="${ iconSize }" y="15" fill="#010101" fill-opacity=".3">${ name }</text>
				    <text x="${ iconSize }" y="14">${ name }</text>` : '' }
				    <text x="${ leftSize + 7 }" y="15" fill="#010101" fill-opacity=".3">${ text }</text>
				    <text x="${ leftSize + 7 }" y="14">${ text }</text>
				  </g>
				</svg>
			`.trim().replace(/\>[\s]+\</gm, '><')
		};
	}
});
