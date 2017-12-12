/* globals popover isRtl */

import {UiTextContext} from 'meteor/rocketchat:lib';

this.popover = {
	renderedPopover: null,
	open(config) {
		this.renderedPopover = Blaze.renderWithData(Template.popover, config, document.body);
	},
	close() {
		if (!this.renderedPopover) {
			return false;
		}

		Blaze.remove(this.renderedPopover);

		const activeElement = this.renderedPopover.dataVar.curValue.activeElement;
		if (activeElement) {
			$(activeElement).removeClass('active');
		}
	}
};

Template.popover.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}

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
		if (mousePosition.y <= popoverHeightHalf) {
			top = 10;
		} else if (mousePosition.y + popoverHeightHalf > windowHeight) {
			top = windowHeight - popoverHeight - 10;
		} else {
			top = mousePosition.y - popoverHeightHalf;
		}

		let left;
		if (mousePosition.x + popoverWidth >= windowWidth) {
			left = mousePosition.x - popoverWidth;
		} else if (mousePosition.x <= popoverWidth) {
			left = isRtl() ? mousePosition.x + 10 : 10;
		} else if (mousePosition.x <= windowWidth / 2) {
			left = mousePosition.x;
		} else {
			left = mousePosition.x - popoverWidth;
		}

		popoverContent.style.top = `${ top }px`;
		popoverContent.style.left = `${ left }px`;
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
		const id = event.currentTarget.dataset.id;
		const action = RocketChat.messageBox.actions.getById(id);
		if ((action[0] != null ? action[0].action : undefined) != null) {
			action[0].action({rid: t.data.data.rid, messageBox: document.querySelector('.rc-message-box'), element: event.currentTarget, event});
			if (id !== 'audio-message') {
				popover.close();
			}
		}
	},
	'click [data-type="message-action"]'(e, t) {
		const button = RocketChat.MessageAction.getButtonById(e.currentTarget.dataset.id);
		if ((button != null ? button.action : undefined) != null) {
			button.action.call(t.data.data, e, t.data.instance);
			popover.close();
			return false;
		}

		if (e.currentTarget.dataset.id === 'report-abuse') {
			const message = t.data.data._arguments[1];
			modal.open({
				title: TAPi18n.__('Report_this_message_question_mark'),
				text: message.msg,
				inputPlaceholder: TAPi18n.__('Why_do_you_want_to_report_question_mark'),
				type: 'input',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: TAPi18n.__('Report_exclamation_mark'),
				cancelButtonText: TAPi18n.__('Cancel'),
				closeOnConfirm: false,
				html: false
			}, (inputValue) => {
				if (inputValue === false) {
					return false;
				}

				if (inputValue === '') {
					modal.showInputError(TAPi18n.__('You_need_to_write_something'));
					return false;
				}

				Meteor.call('reportMessage', message._id, inputValue);

				modal.open({
					title: TAPi18n.__('Report_sent'),
					text: TAPi18n.__('Thank_you_exclamation_mark '),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
			popover.close();
		}
	},
	'click [data-type="set-state"]'(e) {
		AccountBox.setStatus(e.currentTarget.dataset.id);
		RocketChat.callbacks.run('userStatusManuallySet', e.currentTarget.dataset.status);
		popover.close();
	},
	'click [data-type="open"]'(e) {
		const data = e.currentTarget.dataset;

		switch (data.id) {
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

		if (data.href) {
			FlowRouter.go(data.href);
		}

		if (data.sideNav) {
			SideNav.setFlex(data.sideNav);
			SideNav.openFlex();
		}

		popover.close();
	},
	'click [data-type="sidebar-item"]'(e, instance) {
		popover.close();
		const { rid, name, template } = instance.data.data;

		if (e.currentTarget.dataset.id === 'hide') {
			const warnText = RocketChat.roomTypes.roomTypes[template].getUiText(UiTextContext.HIDE_WARNING);

			modal.open({
				title: t('Are_you_sure'),
				text: warnText ? t(warnText, name) : '',
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_hide_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: true,
				html: false
			}, function() {
				if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
					FlowRouter.go('home');
				}

				Meteor.call('hideRoom', rid, function(err) {
					if (err) {
						handleError(err);
					} else if (rid === Session.get('openedRoom')) {
						Session.delete('openedRoom');
					}
				});
			});

			return false;
		}

		if (e.currentTarget.dataset.id === 'leave') {
			let warnText;
			switch (template) {
				case 'c': warnText = 'Leave_Room_Warning'; break;
				case 'p': warnText = 'Leave_Group_Warning'; break;
				case 'd': warnText = 'Leave_Private_Warning'; break;
				case 'l': warnText = 'Hide_Livechat_Warning'; break;
			}

			modal.open({
				title: t('Are_you_sure'),
				text: warnText ? t(warnText, name) : '',
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_leave_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, function(isConfirm) {
				if (isConfirm) {
					Meteor.call('leaveRoom', rid, function(err) {
						if (err) {
							modal.open({
								title: t('Warning'),
								text: handleError(err, false),
								type: 'warning',
								html: false
							});
						} else {
							modal.close();
							if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
								FlowRouter.go('home');
							}
						}
					});
				}
			});

			return false;
		}

		if (e.currentTarget.dataset.id === 'read') {
			Meteor.call('readMessages', rid);
			return false;
		}

		if (e.currentTarget.dataset.id === 'favorite') {
			Meteor.call('toggleFavorite', rid, !$(e.currentTarget).hasClass('rc-popover__item--star-filled'), function(err) {
				popover.close();
				if (err) {
					handleError(err);
				}
			});

			return false;
		}
	}
});
