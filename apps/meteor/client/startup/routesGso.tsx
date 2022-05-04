import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import React, { lazy } from 'react';
import toastr from 'toastr';

import { appLayout } from '../lib/appLayout';
import { createTemplateForComponent } from '../lib/portals/createTemplateForComponent';

// New Routes for GSO app

FlowRouter.route('/blogs', {
	name: 'blogs',
	action: () => {
		const BlogViewPage = createTemplateForComponent('BlogViewPage', () => import('../views/blog/BlogView'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: BlogViewPage });
	},
});

FlowRouter.route('/games', {
	name: 'games',
	action: () => {
		const GamesViewPage = createTemplateForComponent('GamesViewPage', () => import('../views/games/GamesView'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: GamesViewPage });
	},
});

FlowRouter.route('/products', {
	name: 'products',
	action: () => {
		const ProductsViewPage = createTemplateForComponent('ProductsViewPage', () => import('../views/products/ProductsView'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: ProductsViewPage });
	},
});

FlowRouter.route('/store', {
	name: 'store',
	action: () => {
		const StoreViewPage = createTemplateForComponent('StoreViewPage', () => import('../views/store/StoreView'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: StoreViewPage });
	},
});

FlowRouter.route('/messages', {
	name: 'messages',
	action: () => {
		const MessagesViewPage = createTemplateForComponent('MessagesViewPage', () => import('../views/messages/MessagesView'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: MessagesViewPage });
	},
});
