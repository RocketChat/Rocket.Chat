import { FlowRouter } from 'meteor/kadira:flow-router';

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

FlowRouter.route('/blog/detail/:id', {
	name: 'blog-detail',
	action: () => {
		const BlogDetailPageView = createTemplateForComponent('BlogDetailPage', () => import('../views/blog/BlogDetail'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: BlogDetailPageView });
	},
});

FlowRouter.route('/games/detail/:id', {
	name: 'games-detail',
	action: () => {
		const GameDetailPageView = createTemplateForComponent('GameDetailPage', () => import('../views/games/SingleGameDetails'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: GameDetailPageView });
	},
});

FlowRouter.route('/products/detail/:id', {
	name: 'products-detail',
	action: () => {
		const ProductDetailPageView = createTemplateForComponent('ProductDetailPage', () => import('../views/products/SIngleProductDetails'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: ProductDetailPageView });
	},
});
