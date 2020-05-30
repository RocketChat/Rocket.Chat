import './popover.html';
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { hide, leave } from './ChannelActions';
import { messageBox } from './messageBox';
import { MessageAction } from './MessageAction';
import { RoomManager } from './RoomManager';
import { ChatSubscription } from '../../../models/client';
import { isRtl, handleError } from '../../../utils/client';

export const popover = {
	renderedPopover: null,
	open({ currentTarget, ...config }) {
		// Popover position must be computed as soon as possible, avoiding DOM changes over currentTarget
		const data = {
			targetRect: currentTarget && currentTarget.getBoundingClientRect && currentTarget.getBoundingClientRect(),
			...config,
		};
		this.renderedPopover = Blaze.renderWithData(Template.popover, data, document.body);
	},
	close() {
		if (!this.renderedPopover) {
			return false;
		}

		Blaze.remove(this.renderedPopover);

		const { activeElement } = this.renderedPopover.dataVar.curValue;
		if (activeElement) {
			$(activeElement).removeClass('active');
		}
	},
};

Template.popover.helpers({
	hasAction() {
		return !!this.action;
	},
});

Template.popover.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}

	$('.rc-popover').click(function(e) {
		if (e.currentTarget === e.target) {
			popover.close();
		}
	});
	const { offsetVertical = 0, offsetHorizontal = 0 } = this.data;
	const { activeElement } = this.data;
	const popoverContent = this.firstNode.children[0];
	const position = _.throttle(() => {
		const direction = typeof this.data.direction === 'function' ? this.data.direction() : this.data.direction;

		const verticalDirection = /top/.test(direction) ? 'top' : 'bottom';
		const rtlDirection = isRtl() ^ /inverted/.test(direction) ? 'left' : 'right';
		const rightDirection = /right/.test(direction) ? 'right' : rtlDirection;
		const horizontalDirection = /left/.test(direction) ? 'left' : rightDirection;

		const position = typeof this.data.position === 'function' ? this.data.position() : this.data.position;
		const customCSSProperties = typeof this.data.customCSSProperties === 'function' ? this.data.customCSSProperties() : this.data.customCSSProperties;

		const mousePosition = typeof this.data.mousePosition === 'function' ? this.data.mousePosition() : this.data.mousePosition || {
			x: this.data.targetRect[horizontalDirection === 'left' ? 'right' : 'left'],
			y: this.data.targetRect[verticalDirection],
		};
		const offsetWidth = offsetHorizontal * (horizontalDirection === 'left' ? 1 : -1);
		const offsetHeight = offsetVertical * (verticalDirection === 'bottom' ? 1 : -1);

		if (position) {
			popoverContent.style.top = `${ position.top }px`;
			popoverContent.style.left = `${ position.left }px`;
		} else {
			const clientHeight = this.data.targetRect.height;
			const popoverWidth = popoverContent.offsetWidth;
			const popoverHeight = popoverContent.offsetHeight;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			let top = mousePosition.y - clientHeight + offsetHeight;

			if (verticalDirection === 'top') {
				top = mousePosition.y - popoverHeight + offsetHeight;

				if (top < 0) {
					top = 10 + offsetHeight;
				}
			}

			if (top + popoverHeight > windowHeight) {
				top = windowHeight - 10 - popoverHeight - offsetHeight;
			}

			let left = mousePosition.x - popoverWidth + offsetWidth;

			if (horizontalDirection === 'right') {
				left = mousePosition.x + offsetWidth;
			}

			if (left + popoverWidth >= windowWidth) {
				left = mousePosition.x - popoverWidth + offsetWidth;
			}

			if (left <= 0) {
				left = mousePosition.x + offsetWidth;
			}

			popoverContent.style.top = `${ top }px`;
			popoverContent.style.left = `${ left }px`;
		}

		if (customCSSProperties) {
			Object.keys(customCSSProperties).forEach(function(property) {
				popoverContent.style[property] = customCSSProperties[property];
			});
		}

		const realTop = Number(popoverContent.style.top.replace('px', ''));
		if (realTop + popoverContent.offsetHeight > window.innerHeight) {
			popoverContent.style.overflow = 'scroll';
			popoverContent.style.bottom = 0;
			popoverContent.className = 'rc-popover__content rc-popover__content-scroll';
		}

		if (activeElement) {
			$(activeElement).addClass('active');
		}

		popoverContent.style.opacity = 1;
	}, 50);
	$(window).on('resize', position);
	position();
	this.position = position;

	this.firstNode.style.visibility = 'visible';
});

Template.popover.onDestroyed(function() {
	if (this.data.onDestroyed) {
		this.data.onDestroyed();
	}
	$(window).off('resize', this.position);
});

Template.popover.events({
	'click .js-action'(e, instance) {
		!this.action || this.action.call(this, e, instance.data.data);
		popover.close();
	},
	'click .js-close'() {
		popover.close();
	},
	'click [data-type="messagebox-action"]'(event, t) {
		const { id } = event.currentTarget.dataset;
		const actions = messageBox.actions.getById(id);
		actions
			.filter(({ action }) => !!action)
			.forEach(({ action }) => {
				action.call(null, {
					...t.data.data,
					event,
				});
			});
		popover.close();
	},
	'click [data-type="message-action"]'(e, t) {
		const button = MessageAction.getButtonById(e.currentTarget.dataset.id);
		if ((button != null ? button.action : undefined) != null) {
			button.action.call(t.data.data, e, t.data.instance);
			popover.close();
			return false;
		}
	},
	'click [data-type="sidebar-item"]'(e, instance) {
		popover.close();
		const { rid, name, template } = instance.data.data;
		const action = e.currentTarget.dataset.id;

		if (action === 'hide') {
			hide(template, rid, name);
		}

		if (action === 'leave') {
			leave(template, rid, name);
		}

		if (action === 'read') {
			Meteor.call('readMessages', rid);
			return false;
		}

		if (action === 'unread') {
			Meteor.call('unreadMessages', null, rid, function(error) {
				if (error) {
					return handleError(error);
				}

				const subscription = ChatSubscription.findOne({ rid });
				if (subscription == null) {
					return;
				}
				RoomManager.close(subscription.t + subscription.name);

				FlowRouter.go('home');
			});

			return false;
		}

		if (action === 'favorite') {
			Meteor.call('toggleFavorite', rid, !$(e.currentTarget).hasClass('rc-popover__item--star-filled'), function(err) {
				popover.close();
				if (err) {
					handleError(err);
				}
			});

			return false;
		}
	},
});

Template.popover.helpers({
	isSafariIos: /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent),
});
