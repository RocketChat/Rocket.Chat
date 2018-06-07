export class RocketChatTabBar {
	constructor() {
		this.template = new ReactiveVar();
		this.id = new ReactiveVar();
		this.group = new ReactiveVar();
		this.state = new ReactiveVar();
		this.data = new ReactiveVar();
	}

	getTemplate() {
		return this.template.get();
	}

	getId() {
		return this.id.get();
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
		Tracker.afterFlush(() => {
			$('.contextual-bar__container').scrollTop(0).find('input[type=text]:first').focus();
		});

		if (!button) {
			return;
		}
		if (typeof button !== 'object' || !button.id) {
			button = RocketChat.TabBar.getButton(button);
		}
		$('.flex-tab, .contextual-bar').css('width', button.width ? `${ button.width }px` : '');
		this.template.set(button.template);
		this.id.set(button.id);
		return button;
	}

	close() {
		this.state.set('');

		$('.flex-tab, .contextual-bar').css('width', '');

		this.template.set();
		this.id.set();
	}
}
