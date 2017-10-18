for (const tpl in Template) {
	if (Template.hasOwnProperty(tpl) && tpl.startsWith('dynamic_redlink_')) {
		Template[tpl].onRendered(function() {
			this.$('.field-with-label').each(function(indx, wrapperItem) {
				const inputField = $(wrapperItem).find('.knowledge-base-value');
				$(wrapperItem).find('.icon-cancel').data('initValue', inputField.val());
			});
			this.$('.datetime-field').each(function(indx, inputFieldItem) {
				$.datetimepicker.setDateFormatter({
					parseDate(date, format) {
						const d = moment(date, format);
						return d.isValid() ? d.toDate() : false;
					},
					formatDate(date, format) {
						return moment(date).format(format);
					}
				});
				$(inputFieldItem).datetimepicker({
					dayOfWeekStart: 1,
					format: 'L LT',
					formatTime: 'LT',
					formatDate: 'L',
					validateOnBlur: false // prevent validation to use question mark as placeholder
				});
			});
		});
	}
}

Template.dbsAI_externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, {ts: 1});
	},
	dynamicTemplateExists() {
		return !!Template[`dynamic_redlink_${ this.queryType }`];
	},
	queryTemplate() {
		return `dynamic_redlink_${ this.queryType }`;
	},
	isLivechat() {
		const instance = Template.instance();
		return ChatSubscription.findOne({rid: instance.data.rid}).t === 'l';
	},
	filledQueryTemplate() {
		const knowledgebaseSuggestions = RocketChat.models.LivechatExternalMessage.findByRoomId(Template.currentData().rid,
			{ts: -1}).fetch();
		const filledTemplate = [];
		if (knowledgebaseSuggestions.length > 0) {
			const tokens = knowledgebaseSuggestions[0].prepareResult.tokens;
			$(knowledgebaseSuggestions[0].prepareResult.queryTemplates).each(function(indexTpl, queryTpl) {
				const extendedQueryTpl = queryTpl;
				const filledQuerySlots = [];

				/* tokens und queryTemplates mergen */
				$(queryTpl.querySlots).each(function(indxSlot, slot) {
					if (slot.tokenIndex !== -1) {
						const currentToken = tokens[slot.tokenIndex];
						if (currentToken.type === 'Date' && typeof currentToken.value === 'object') {
							slot.clientValue = moment(currentToken.value.date).format('L LT');
						} else {
							slot.clientValue = currentToken.value;
						}
						slot.tokenVal = currentToken;
					} else {
						slot.clientValue = '?';
					}
					filledQuerySlots.push(slot);
				});

				extendedQueryTpl.filledQuerySlots = filledQuerySlots.filter(slot => slot.role !== 'topic'); //topic represents the template itself
				extendedQueryTpl.forItem = function(itm) {
					let returnValue = {
						htmlId: Meteor.uuid(),
						item: '?',
						itemStyle: 'empty-style',
						inquiryStyle: 'disabled',
						label: `topic_${ itm }`,
						parentTplIndex: indexTpl //todo replace with looping index in html
					};
					if (typeof extendedQueryTpl.filledQuerySlots === 'object') {
						const slot = extendedQueryTpl.filledQuerySlots.find((ele) => ele.role === itm);
						if (slot) {
							returnValue = _.extend(slot, returnValue);
							returnValue.item = slot.clientValue;
							if (!_.isEmpty(slot.inquiryMessage)) {
								returnValue.inquiryStyle = '';
							}
							if (returnValue.item !== '' && returnValue.item !== '?') {
								returnValue.itemStyle = '';
							}
							if (returnValue.tokenType === 'Date') {
								returnValue.itemStyle = `${ returnValue.itemStyle } datetime-field`;
							}
						}
					}
					return returnValue;
				};

				extendedQueryTpl.dummyEinstiegshilfe = function() { //todo: Entfernen, wenn Redlink die Hilfeart erkennt
					return {
						htmlId: Meteor.uuid(),
						item: 'Einstiegshilfe',
						itemStyle: '',
						inquiryStyle: '',
						label: t('topic_supportType'),
						parentTplIndex: 0 //todo replace with looping index in html
					};
				};
				filledTemplate.push(extendedQueryTpl);
			});
		}
		return filledTemplate;
	},
	queriesContext(queries, templateIndex) {
		const instance = Template.instance();
		$(queries).each(function(indx) {
			if (queries[indx].creator && typeof queries[indx].creator === 'string') {
				queries[indx].replacedCreator = queries[indx].creator.replace(/\.|-/g, '_');
			} else {
				queries[indx].replacedCreator = '';
			}
		});
		return {
			queries,
			roomId: instance.data.rid,
			templateIndex
		};
	},
	helpRequestByRoom() {
		const instance = Template.instance();
		return instance.helpRequest.get();
	}
});


Template.dbsAI_externalSearch.events({
	/**
	 * Notifies that a query was confirmed by an agent (aka. clicked)
	 */
	'click .knowledge-queries-wrapper .query-item a '(event, instance) {
		const query = $(event.target).closest('.query-item');
		const externalMsg = instance.externalMessages.get();
		externalMsg.prepareResult.queryTemplates[query.data('templateIndex')].queries[query.data('queryIndex')].state = 'Confirmed';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			if (err) { //TODO logging error
			}
		});
	},
	/**
	 * Hide datetimepicker when right mouse clicked
	 */
	'mousedown .field-with-label'(event) {
		if (event.button === 2) {
			$('body').addClass('suppressDatetimepicker');
			setTimeout(() => {
				$('.datetime-field').datetimepicker('hide');
				$('body').removeClass('suppressDatetimepicker');
			}, 500);
		}
	},
	/*
	 * open contextmenu with "-edit, -delete and -nachfragen"
	 * */
	'contextmenu .field-with-label'(event, instance) {
		event.preventDefault();
		instance.$('.knowledge-input-wrapper.active').removeClass('active');
		instance.$(event.currentTarget).find('.knowledge-input-wrapper').addClass('active');
		$(document).off('mousedown.contextmenu').on('mousedown.contextmenu', function(e) {
			if (!$(e.target).parent('.knowledge-base-tooltip').length > 0) {
				$('.knowledge-input-wrapper.active').removeClass('active');
			}
		});
	},
	'click .query-template-tools-wrapper .icon-up-open'(event) {
		$(event.currentTarget).closest('.query-template-wrapper').toggleClass('collapsed');
	},
	/**
	 * Mark a template as confirmed
	 */
	'click .query-template-tools-wrapper .icon-ok'(event, instance) {
		const query = $(event.target).closest('.query-template-wrapper');
		const externalMsg = instance.externalMessages.get();
		externalMsg.prepareResult.queryTemplates[query.data('templateIndex')].state = 'Confirmed';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			if (err) { //TODO logging error
			}
		});
	},
	/**
	 * Mark a template as rejected.
	 */
	'click .query-template-tools-wrapper .icon-cancel'(event, instance) {
		const query = $(event.target).closest('.query-template-wrapper');
		const externalMsg = instance.externalMessages.get();
		externalMsg.prepareResult.queryTemplates[query.data('templateIndex')].state = 'Rejected';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			if (err) { //TODO logging error
			}
		});
	},

	'keydup .knowledge-base-value, keydown .knowledge-base-value'(event) {
		const inputWrapper = $(event.currentTarget).closest('.field-with-label');
		const ENTER_KEY = 13;
		const ESC_KEY = 27;
		const TAB_KEY = 9;
		const keycode = event.keyCode;
		if (inputWrapper.hasClass('editing')) {
			switch (keycode) {
				case ENTER_KEY:
					inputWrapper.find('.icon-floppy').click();
					break;
				case ESC_KEY:
				case TAB_KEY:
					inputWrapper.find('.icon-cancel').click();
					break;
			}
		} else if (keycode !== TAB_KEY) {
			$('.field-with-label.editing').removeClass('editing');
			inputWrapper.addClass('editing');
		}
	},
	'click .knowledge-input-wrapper .icon-cancel'(event) {
		const inputWrapper = $(event.currentTarget).closest('.field-with-label');
		const inputField = inputWrapper.find('.knowledge-base-value');
		inputWrapper.removeClass('editing');
		inputField.val($(event.currentTarget).data('initValue'));
	},
	'click .knowledge-input-wrapper .icon-floppy'(event, instance) {
		event.preventDefault();
		const inputWrapper = $(event.currentTarget).closest('.field-with-label');
		const templateWrapper = $(event.currentTarget).closest('.query-template-wrapper');
		const inputField = inputWrapper.find('.knowledge-base-value');

		inputWrapper.removeClass('editing');
		templateWrapper.addClass('spinner');
		const saveValue = inputField.val();
		inputWrapper.find('.icon-cancel').data('initValue', saveValue);

		const externalMsg = instance.externalMessages.get();
		const newToken = {
			confidence: 0.95,
			messageIdx: -1,
			start: -1,
			end: -1,
			state: 'Confirmed',
			hints: [],
			type: _.isEmpty(inputWrapper.data('tokenType')) ? 'Unknown' : inputWrapper.data('tokenType'),
			origin: 'Agent',
			value: inputField.hasClass('datetime-field') ?
			{
				grain: 'minute',
				date: moment(saveValue, 'L LT').toISOString()
			} :
				saveValue
		};

		externalMsg.prepareResult.tokens.push(newToken);
		externalMsg.prepareResult.queryTemplates[inputWrapper.data('parentTplIndex')].querySlots = _.map(externalMsg.prepareResult.queryTemplates[inputWrapper.data('parentTplIndex')].querySlots,
			(query) => {
				if (query.role === inputWrapper.data('slotRole')) {
					query.tokenIndex = externalMsg.prepareResult.tokens.length - 1;
				}
				return query;
			});
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			templateWrapper.removeClass('spinner');
			instance.$('.knowledge-input-wrapper.active').removeClass('active');
			if (err) { //TODO logging error
			}
		});
	},
	'click .knowledge-base-tooltip .edit-item, click .knowledge-base-value, click .knowledge-base-label'(event) {
		event.preventDefault();
		const inputWrapper = $(event.currentTarget).closest('.field-with-label');
		const inputField = inputWrapper.find('.knowledge-base-value');

		if (!inputWrapper.hasClass('editing')) {
			$('.field-with-label.editing').removeClass('editing');
			inputField.focus().select();
			inputWrapper.addClass('editing');
		}
	},
	/**
	 * Deletes a token from a queryTemplate and mark it as rejected.
	 */
	'click .knowledge-base-tooltip .delete-item'(event, instance) {
		event.preventDefault();
		const field = $(event.target).closest('.field-with-label');
		const templateIndex = field.attr('data-parent-tpl-index');
		const slotRole = field.attr('data-slot-role');
		const externalMsg = instance.externalMessages.get();
		externalMsg.prepareResult.queryTemplates[templateIndex].querySlots = _.map(externalMsg.prepareResult.queryTemplates[templateIndex].querySlots,
			(query) => {
				if (query.role === slotRole) {
					query.tokenIndex = -1;
				}
				return query;
			});
		externalMsg.prepareResult.tokens[field.attr('data-token-index')].state = 'Rejected';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			instance.$('.knowledge-input-wrapper.active').removeClass('active');
			if (err) { //TODO logging error
			}
		});

	},
	/**
	 * Writes the inqury of an queryTemplateSlot to the chatWindowInputField.
	 */
	'click .knowledge-base-tooltip .chat-item:not(.disabled)'(event, inst) {
		event.preventDefault();
		const rlData = _.first(RocketChat.models.LivechatExternalMessage.findByRoomId(inst.roomId, {ts: -1}).fetch());
		if (rlData && rlData.prepareResult) {
			const input = inst.$(event.target).closest('.field-with-label');
			const slotRole = input.attr('data-slot-role');
			const qSlot = _.find(rlData.prepareResult.queryTemplates[input.attr('data-parent-tpl-index')].querySlots, (slot) => {
				return slot.role === slotRole;
			});
			if (qSlot && qSlot.inquiryMessage) {
				const inputBox = $(`#chat-window-${ inst.roomId } .input-message`);
				const initialInputBoxValue = inputBox.val() ? `${ inputBox.val() } ` : '';
				inputBox.val(initialInputBoxValue + qSlot.inquiryMessage).focus().trigger('keyup');
				inst.$('.knowledge-input-wrapper.active').removeClass('active');
			}
		}
	},
	/**
	 * Switches the tokens between two slots within a query template.
	 */
	'click .external-message .icon-wrapper .icon-exchange'(event, instance) {
		const changeBtn = $(event.target).parent().closest('.icon-wrapper');
		const left = changeBtn.prevAll('.field-with-label');
		const right = changeBtn.nextAll('.field-with-label');
		const leftTokenIndex = parseInt(left.attr('data-token-index'));
		const rightTokenIndex = parseInt(right.attr('data-token-index'));
		if (changeBtn.hasClass('spinner')) {
			return;
		}
		changeBtn.addClass('spinner');
		const externalMsg = instance.externalMessages.get();
		externalMsg.prepareResult.queryTemplates[left.data('parentTplIndex')].querySlots = _.map(externalMsg.prepareResult.queryTemplates[left.data('parentTplIndex')].querySlots,
			(query) => {
				if (query.tokenIndex === leftTokenIndex) {
					query.tokenIndex = rightTokenIndex;
				} else if (query.tokenIndex === rightTokenIndex) {
					query.tokenIndex = leftTokenIndex;
				}
				return query;
			});
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			changeBtn.removeClass('spinner');
			if (err) { //TODO logging error
			}
		});
	}
});

Template.dbsAI_externalSearch.onCreated(function() {
	this.externalMessages = new ReactiveVar([]);
	this.helpRequest = new ReactiveVar(null);

	const instance = this;
	this.autorun(() => {
		instance.subscribe('livechat:externalMessages', instance.data.rid);
		const extMsg = RocketChat.models.LivechatExternalMessage.findByRoomId(instance.data.rid, {ts: -1}).fetch();
		if (extMsg.length > 0) {
			instance.externalMessages.set(extMsg[0]);
		}

		if (instance.data.rid) {
			// instance.subscribe('assistify:helpRequest', instance.data.rid);
			// const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(instance.roomId);
			// instance.helpRequest.set(helpRequest);

			if (!instance.helpRequest.get()) { //todo remove after PoC: Non-reactive method call
				Meteor.call('assistify:helpRequestByRoomId', instance.data.rid, (err, result) => {
					if (!err) {
						instance.helpRequest.set(result);
					} else {
						console.log(err);
					}
				});
			}
		}
	});
});
