import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.API.v1.addRoute('info', { authRequired: false }, {
	get() {
		const user = this.getLoggedInUser();

		if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
			return RocketChat.API.v1.success({
				info: RocketChat.Info,
			});
		}

		return RocketChat.API.v1.success({
			info: {
				version: RocketChat.Info.version,
			},
		});
	},
});

RocketChat.API.v1.addRoute('me', { authRequired: true }, {
	get() {
		return RocketChat.API.v1.success(this.getUserInfo(RocketChat.models.Users.findOneById(this.userId)));
	},
});

let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute
RocketChat.API.v1.addRoute('shield.svg', { authRequired: false }, {
	get() {
		const { type, channel, name, icon } = this.queryParams;
		if (!RocketChat.settings.get('API_Enable_Shields')) {
			throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', { route: '/api/v1/shield.svg' });
		}

		const types = RocketChat.settings.get('API_Shield_Types');
		if (type && (types !== '*' && !types.split(',').map((t) => t.trim()).includes(type))) {
			throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', { route: '/api/v1/shield.svg' });
		}

		const hideIcon = icon === 'false';
		if (hideIcon && (!name || !name.trim())) {
			return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
		}

		let text;
		let backgroundColor = '#4c1';
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
			case 'user':
				const user = this.getUserFromParams();

				// Respect the server's choice for using their real names or not
				if (user.name && RocketChat.settings.get('UI_Use_Real_Name')) {
					text = `${ user.name }`;
				} else {
					text = `@${ user.username }`;
				}

				switch (user.status) {
					case 'online':
						backgroundColor = '#1fb31f';
						break;
					case 'away':
						backgroundColor = '#dc9b01';
						break;
					case 'busy':
						backgroundColor = '#bc2031';
						break;
					case 'offline':
						backgroundColor = '#a5a1a1';
				}
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
				    <path fill="${ backgroundColor }" d="M${ leftSize } 0h${ rightSize }v${ height }H${ leftSize }z"/>
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
			`.trim().replace(/\>[\s]+\</gm, '><'),
		};
	},
});

RocketChat.API.v1.addRoute('spotlight', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			query: String,
		});

		const { query } = this.queryParams;

		const result = Meteor.runAsUser(this.userId, () =>
			Meteor.call('spotlight', query)
		);

		return RocketChat.API.v1.success(result);
	},
});

RocketChat.API.v1.addRoute('directory', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		const { text, type } = query;
		if (sort && Object.keys(sort).length > 1) {
			return RocketChat.API.v1.failure('This method support only one "sort" parameter');
		}
		const sortBy = sort ? Object.keys(sort)[0] : undefined;
		const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('browseChannels', {
			text,
			type,
			sortBy,
			sortDirection,
			offset: Math.max(0, offset),
			limit: Math.max(0, count),
		}));

		if (!result) {
			return RocketChat.API.v1.failure('Please verify the parameters');
		}
		return RocketChat.API.v1.success({
			result: result.results,
			count: result.results.length,
			offset,
			total: result.total,
		});
	},
});

RocketChat.API.v1.addRoute('invite.email', { authRequired: true }, {
	post() {
		if (!this.bodyParams.email) {
			throw new Meteor.Error('error-email-param-not-provided', 'The required "email" param is required.');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('sendInvitationEmail', [this.bodyParams.email]));
		return RocketChat.API.v1.success();

		// sendInvitationEmail always returns an empty list
		/*
		if(this.bodyParams.email in result){
			return RocketChat.API.v1.success();
		}else{
			return RocketChat.API.v1.failure('Email Invite Failed');
		}
		*/
	},
});

RocketChat.API.v1.addRoute('invite.sms', { authRequired: true }, {
	post() {
		if (!this.bodyParams.phone) {
			throw new Meteor.Error('error-phone-param-not-provided', 'The required "phone" param is required.');
		}
		const phone = this.bodyParams.phone.replace(/-|\s/g, '');
		const result = Meteor.runAsUser(this.userId, () => Meteor.call('sendInvitationSMS', [phone]));
		if (result.indexOf(phone) >= 0) {
			return RocketChat.API.v1.success();
		} else {
			return RocketChat.API.v1.failure('SMS Invite Failed');
		}
	},
});
