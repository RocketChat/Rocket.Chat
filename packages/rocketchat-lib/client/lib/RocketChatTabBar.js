export class RocketChatTabBar {
	constructor() {
		this.template = new ReactiveVar();
		this.group = new ReactiveVar();
		this.state = new ReactiveVar();
		this.data = new ReactiveVar();
	}

	getTemplate() {
		return this.template.get();
	}

	setTemplate(template) {
		this.template.set(template);
	}

	currentGroup() {
		return this.group.get();
	}

	showGroup(group) {
		this.group.set(group);
	}

	setData(d) {
		this.data.set(d);
	}

	getData() {
		return this.data.get();
	}

	getButtons() {
		return RocketChat.TabBar.getButtons();
	}

	getState() {
		return this.state.get();
	}

	open(button) {
		this.state.set('opened');

		if (button) {
			if (typeof button !== 'object' || !button.id) {
				button = RocketChat.TabBar.getButton(button);
			}
			if (button.width) {
				$('.flex-tab').css('width', `${ button.width }px`);
			} else {
				$('.flex-tab').css('width', '');
			}
			this.template.set(button.template);
		}

		Tracker.afterFlush(() => {
			$('.flex-tab').find('input[type=text]:first').focus();
			$('.flex-tab .content').scrollTop(0);
		});
	}

	close() {
		this.state.set('');

		$('.flex-tab').css('width', '');

		this.template.set();
	}
}
