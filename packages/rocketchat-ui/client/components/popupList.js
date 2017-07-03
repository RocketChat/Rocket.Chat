Template.popupList.helpers({
	config() {
		return {
			template: this.template_list || 'popupList_default',
			data: {
				template_item :this.template_item || 'popupList_item_default',
				items: this.items,
				onClick: this.onClick || function() { console.log('click'); },
				modifier: this.modifier || function(text) { return text; }
			}
		};
	},
	open() {
		return true;
	}
});
Template.popupList_default.helpers({
	config(item) {
		return {
			template: this.template_item || 'popupList_item_default',
			data: {
				item,
				onClick: this.onClick,
				modifier: this.modifier
			}
		};
	}
});

Template.popupList_item_default.events({
	'click li'() {
		this.onClick(this.item);
	}
});
