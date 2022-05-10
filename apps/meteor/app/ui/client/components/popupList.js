import { Template } from 'meteor/templating';

import { settings } from '../../../settings';

Template.popupList.helpers({
	config() {
		return {
			template: this.data.template_list || 'popupList_default',
			data: {
				ready: this.ready,
				loading: this.ready !== undefined && !this.ready,
				noMatchTemplate: this.data.noMatchTemplate,
				template_item: this.data.template_item || 'popupList_item_default',
				items: this.items,
				onClick: this.data.onClick || function () {},
				modifier:
					this.data.modifier ||
					function (text) {
						return text;
					},
			},
		};
	},
	open() {
		const instance = Template.instance();
		return instance.data.items.length > 0;
	},
});

Template.popupList_default.helpers({
	config(item) {
		return {
			template: this.template_item || 'popupList_item_default',
			data: {
				item,
				onClick: this.onClick,
				modifier: this.modifier,
			},
		};
	},
});

Template.popupList_item_default.helpers({
	showRealNames() {
		return settings.get('UI_Use_Real_Name');
	},
});
