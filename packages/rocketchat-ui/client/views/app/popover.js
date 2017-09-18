/* globals popover */

this.popover = {
	renderedPopover: null,
	open(config) {
		this.renderedPopover = Blaze.renderWithData(Template.popover, config, document.body);
	},
	close() {
		Blaze.remove(this.renderedPopover);

		const activeElement = this.renderedPopover.dataVar.curValue.activeElement;
		if (activeElement) {
			$(activeElement).removeClass('active');
		}
	}
};

Template.popover.onRendered(function() {
	$('.rc-popover').click(function(e) {
		if (e.currentTarget === e.target) {
			popover.close();
		}
	});

	const activeElement = this.data.activeElement;
	const popoverContent = this.firstNode.children[0];
	const position = this.data.position;
	const customCSSProperties = this.data.customCSSProperties;

	if (position) {
		popoverContent.style.top = `${ position.top }px`;
		popoverContent.style.left = `${ position.left }px`;
	} else {
		const popoverWidth = popoverContent.offsetWidth;
		const popoverHeight = popoverContent.offsetHeight;
		const popoverHeightHalf = popoverHeight / 2;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		const mousePosition = this.data.mousePosition;

		let top;
		if (mousePosition.y <= popoverHeight) {
			top = 10;
		} else if (mousePosition.y + popoverHeightHalf > windowHeight) {
			top = windowHeight - popoverHeight - 10;
		} else {
			top = mousePosition.y - popoverHeightHalf;
		}

		let right;
		if (mousePosition.x + popoverWidth >= windowWidth) {
			right = mousePosition.x - popoverWidth;
		} else if (mousePosition.x <= popoverWidth) {
			right = 10;
		} else if (mousePosition.x <= windowWidth / 2) {
			right = mousePosition.x;
		} else {
			right = mousePosition.x - popoverWidth;
		}

		popoverContent.style.top = `${ top }px`;
		popoverContent.style.left = `${ right }px`;
	}

	if (customCSSProperties) {
		Object.keys(customCSSProperties).forEach(function(property) {
			popoverContent.style[property] = customCSSProperties[property];
		});
	}

	if (activeElement) {
		$(activeElement).addClass('active');
	}

	popoverContent.style.opacity = 1;
});

Template.popover.events({
	'click [data-type="messagebox-action"]'(event, t) {
		const action = RocketChat.messageBox.actions.getById(event.currentTarget.dataset.id);
		if ((action[0] != null ? action[0].action : undefined) != null) {
			action[0].action({rid: t.data.data.rid, messageBox: document.querySelector('.rc-message-box'), element: event.currentTarget, event});
			popover.close();
		}
	},
	'click [data-type="message-action"]'(e, t) {
		const button = RocketChat.MessageAction.getButtonById(e.currentTarget.dataset.id);
		if ((button != null ? button.action : undefined) != null) {
			button.action.call(t.data.data, e, t.data.instance);
			popover.close();
		}
	},
	'click [data-type="set-state"]'(e) {
		AccountBox.setStatus(e.currentTarget.dataset.id);
		RocketChat.callbacks.run('userStatusManuallySet', e.currentTarget.dataset.status);
		popover.close();
	},
	'click [data-type="open"]'(e) {
		const open = e.currentTarget.dataset.id;

		switch (open) {
			case 'account':
				SideNav.setFlex('accountFlex');
				SideNav.openFlex();
				FlowRouter.go('account');
				break;
			case 'logout':
				const user = Meteor.user();
				Meteor.logout(() => {
					RocketChat.callbacks.run('afterLogoutCleanUp', user);
					Meteor.call('logoutCleanUp', user);
					FlowRouter.go('home');
				});
				break;
			case 'administration':
				SideNav.setFlex('adminFlex');
				SideNav.openFlex();
				FlowRouter.go('admin-info');
				break;
		}

		if (this.href) {
			FlowRouter.go(this.href);
		}

		if (this.sideNav != null) {
			SideNav.setFlex(this.sideNav);
			SideNav.openFlex();
		}

		popover.close();
	}
});
