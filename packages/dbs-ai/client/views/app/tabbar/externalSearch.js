for (var tpl in Template) {
	if (Template.hasOwnProperty(tpl) && tpl.startsWith('dynamic_redlink_')) {
		Template[tpl].onRendered(function () {
			this.$('.field-with-label').each(function(indx, wrapperItem) {
				const inputField = $(wrapperItem).find(".knowledge-base-value");
				$(wrapperItem).find(".icon-cancel").data("initValue", inputField.val());
			});
			this.$('.datetime-field').each(function(indx, inputFieldItem) {
				$.datetimepicker.setDateFormatter({
					parseDate: function (date, format) {
						var d = moment(date, format);
						return d.isValid() ? d.toDate() : false;
					},
					formatDate: function (date, format) {
						return moment(date).format(format);
					}
				});
				$(inputFieldItem).datetimepicker({
					dayOfWeekStart: 1,
					format: 'L LT',
					formatTime: 'LT',
					formatDate: 'L',
					validateOnBlur:false // prevent validation to use questionmark as placeholder
				});
			});
		});
	}
}

Template.reisebuddy_externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, {ts: 1});
	},
	dynamicTemplateExists() {
		return !!Template['dynamic_redlink_' + this.queryType];
	},
	queryTemplate() {
		return 'dynamic_redlink_' + this.queryType;
	},
	filledQueryTemplate() {
		var knowledgebaseSuggestions = RocketChat.models.LivechatExternalMessage.findByRoomId(Template.currentData().rid,
			{ts: -1}).fetch(), filledTemplate = [];
		if (knowledgebaseSuggestions.length > 0) {
			const tokens = knowledgebaseSuggestions[0].result.tokens;
			$(knowledgebaseSuggestions[0].result.queryTemplates).each(function (indexTpl, queryTpl) {
				let extendedQueryTpl = queryTpl, filledQuerySlots = [];

				/* tokens und queryTemplates mergen */
				$(queryTpl.querySlots).each(function (indxSlot, slot) {
					if (slot.tokenIndex != -1) {
						const currentToken = tokens[slot.tokenIndex];
						if (currentToken.type === "Date" && typeof currentToken.value === "object") {
							slot.clientValue = moment(currentToken.value.date).format("L LT");
						} else {
							slot.clientValue = currentToken.value;
						}
						slot.tokenVal = currentToken;
					} else {
						slot.clientValue = "?";
					}
					filledQuerySlots.push(slot);
				});

				extendedQueryTpl.filledQuerySlots = filledQuerySlots;
				extendedQueryTpl.forItem = function (itm) {
					let returnValue = {
						htmlId: Meteor.uuid(),
						item: "?",
						itemStyle: "empty-style",
						inquiryStyle: "disabled",
						label: 'topic_' + itm,
						parentTplIndex: indexTpl //todo replace with looping index in html
					};
					if (typeof extendedQueryTpl.filledQuerySlots === "object") {
						const slot = extendedQueryTpl.filledQuerySlots.find((ele) => ele.role === itm);
						if (slot) {
							returnValue = _.extend(slot, returnValue);
							returnValue.item = slot.clientValue;
							if (!_.isEmpty(slot.inquiryMessage)) {
								returnValue.inquiryStyle = '';
							}
							if (returnValue.item !== "" && returnValue.item !== "?") {
								returnValue.itemStyle = "";
							}
							if (returnValue.tokenType === "Date") {
								returnValue.itemStyle = returnValue.itemStyle + " datetime-field";
							}
						}
					}
					return returnValue;
				};

				extendedQueryTpl.dummyEinstiegshilfe = function() { //todo: Entfernen, wenn Redlink die Hilfeart erkennt
					return {
						htmlId: Meteor.uuid(),
						item: "Einstiegshilfe",
						itemStyle: "",
						inquiryStyle: "",
						label: t('topic_supportType'),
						parentTplIndex: 0 //todo replace with looping index in html
					};
				};
				filledTemplate.push(extendedQueryTpl);
			});
		}
		return filledTemplate;
	},
	queriesContext(queries, templateIndex){
		const instance = Template.instance();
		$(queries).each(function (indx, queryItem) {
			if(queries[indx].creator && typeof queries[indx].creator == "string") {
				queries[indx].replacedCreator = queries[indx].creator.replace(/\./g, "_");
			} else {
				queries[indx].replacedCreator = "";
			}
		});
		return {
			queries: queries,
			roomId: instance.data.rid,
			templateIndex: templateIndex
		}
	}
	,
	helpRequestByRoom(){
		const instance = Template.instance();
		return instance.helpRequest.get();
	}
});


Template.reisebuddy_externalSearch.events({
	/**
	 * Notifies that a query was confirmed by an agent (aka. clicked)
	 */
	'click .knowledge-queries-wrapper .query-item a ': function (event, instance) {
		const query = $(event.target).closest('.query-item');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[query.data('templateIndex')].queries[query.data('queryIndex')].state = 'Confirmed';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(),(err) => {
			if (err) {//TODO logging error
			}
		});
	},
	/**
	 * Hide datetimepicker when right mouse clicked
	 */
	'mousedown .field-with-label': function(event, instance) {
		if(event.button === 2) {
			$("body").addClass("suppressDatetimepicker");
			setTimeout(() => {
				$('.datetime-field').datetimepicker("hide");
				$("body").removeClass("suppressDatetimepicker");
			}, 500);
		}
	},
	/*
	* open contextmenu with "-edit, -delete and -nachfragen"
	* */
	'contextmenu .field-with-label': function (event, instance) {
		event.preventDefault();
		instance.$(".knowledge-input-wrapper.active").removeClass("active");
		instance.$(event.currentTarget).find(".knowledge-input-wrapper").addClass("active");
		$(document).off("mousedown.contextmenu").on("mousedown.contextmenu", function (e) {
			if (!$(e.target).parent(".knowledge-base-tooltip").length > 0) {
				$(".knowledge-input-wrapper.active").removeClass("active");
			}
		});
	},
	'click .query-template-tools-wrapper .icon-up-open': function (event) {
		$(event.currentTarget).closest(".query-template-wrapper").toggleClass("collapsed");
	},
	/**
	 * Mark a template as confirmed
	 */
	'click .query-template-tools-wrapper .icon-ok': function (event, instance) {
		const query = $(event.target).closest('.query-template-wrapper');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[query.data('templateIndex')].state = 'Confirmed';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			if (err) {//TODO logging error
			}
		});
	},
	/**
	 * Mark a template as rejected.
	 */
	'click .query-template-tools-wrapper .icon-cancel': function (event, instance) {
		const query = $(event.target).closest('.query-template-wrapper');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[query.data('templateIndex')].state = 'Rejected';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			if (err) {//TODO logging error
			}
		});
	},

	'keydup .knowledge-base-value, keydown .knowledge-base-value': function (event, inst) {
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			ENTER_KEY = 13,
			ESC_KEY = 27,
			TAB_KEY = 9,
			keycode = event.keyCode;
		if (inputWrapper.hasClass("editing")) {
			switch (keycode) {
				case ENTER_KEY:
					inputWrapper.find(".icon-floppy").click();
					break;
				case ESC_KEY:
				case TAB_KEY:
					inputWrapper.find(".icon-cancel").click();
					break;
			}
		} else if(keycode != TAB_KEY) {
			$(".field-with-label.editing").removeClass("editing");
			inputWrapper.addClass('editing');
		}
	},
	'click .knowledge-input-wrapper .icon-cancel': function (event, instance) {
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			inputField = inputWrapper.find(".knowledge-base-value");
		inputWrapper.removeClass("editing");
		inputField.val($(event.currentTarget).data("initValue"));
	},
	'click .knowledge-input-wrapper .icon-floppy': function (event, instance) {
		event.preventDefault();
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			templateWrapper = $(event.currentTarget).closest(".query-template-wrapper"),
			inputField = inputWrapper.find(".knowledge-base-value");
		inputWrapper.removeClass("editing");
		templateWrapper.addClass("spinner");
		const saveValue = inputField.val();
		inputWrapper.find(".icon-cancel").data("initValue", saveValue);

		let externalMsg = instance.externalMessages.get();
		const newToken = {
			confidence: 0.95,
			messageIdx: -1,
			start: -1,
			end: -1,
			state: "Confirmed",
			hints: [],
			type: _.isEmpty(inputWrapper.data('tokenType')) ?  'Unknown' : inputWrapper.data('tokenType'),
			origin: "Agent",
			value: inputField.hasClass('datetime-field') ?
			{
				grain: 'minute',
				date: moment(saveValue, "L LT").toISOString()
			} :
				saveValue
		};

		externalMsg.result.tokens.push(newToken);
		externalMsg.result.queryTemplates[inputWrapper.data('parentTplIndex')].querySlots = _.map(externalMsg.result.queryTemplates[inputWrapper.data('parentTplIndex')].querySlots,
			(query) => {
				if (query.role === inputWrapper.data('slotRole')) {
					query.tokenIndex = externalMsg.result.tokens.length - 1;
				}
				return query;
			});
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			templateWrapper.removeClass("spinner");
			instance.$(".knowledge-input-wrapper.active").removeClass("active");
			if (err) {//TODO logging error
			}
		});
	},
	'click .knowledge-base-tooltip .edit-item, click .knowledge-base-value, click .knowledge-base-label': function (event, instance) {
		event.preventDefault();
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			inputField = inputWrapper.find(".knowledge-base-value");

		if (!inputWrapper.hasClass('editing')) {
			$(".field-with-label.editing").removeClass("editing");
			inputField.focus().select();
			inputWrapper.addClass('editing');
		}
	},
	/**
	 * Deletes a token from a queryTemplate and mark it as rejected.
	 */
	'click .knowledge-base-tooltip .delete-item': function (event, instance) {
		event.preventDefault();
		const field = $(event.target).closest('.field-with-label'),
			templateIndex = field.attr('data-parent-tpl-index'),
			slotRole = field.attr('data-slot-role');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[templateIndex].querySlots = _.map(externalMsg.result.queryTemplates[templateIndex].querySlots,
			(query) => {
				if (query.role === slotRole) {
					query.tokenIndex = -1;
				}
				return query;
			});
		externalMsg.result.tokens[field.attr('data-token-index')].state = "Rejected";
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(), (err) => {
			instance.$(".knowledge-input-wrapper.active").removeClass("active");
			if (err) {//TODO logging error
			}
		});

	},
	/**
	 * Writes the inqury of an queryTemplateSlot to the chatWindowInputField.
	 */
	'click .knowledge-base-tooltip .chat-item:not(.disabled)': function (event, inst) {
		event.preventDefault();
		const rlData = _.first(RocketChat.models.LivechatExternalMessage.findByRoomId(inst.roomId, {ts: -1}).fetch());
		if (rlData && rlData.result) {
			const input = inst.$(event.target).closest('.field-with-label'),
				slotRole = input.attr('data-slot-role');
			const qSlot = _.find(rlData.result.queryTemplates[input.attr('data-parent-tpl-index')].querySlots, (slot) => {
				return slot.role == slotRole;
			});
			if (qSlot && qSlot.inquiryMessage) {
				const inputBox = $('#chat-window-' + inst.roomId + ' .input-message');
				const initialInputBoxValue = inputBox.val() ? inputBox.val() + ' ' : '';
				inputBox.val(initialInputBoxValue + qSlot.inquiryMessage).focus().trigger('keyup');
				inst.$(".knowledge-input-wrapper.active").removeClass("active");
			}
		}
	},
	/**
	 * Switches the tokens between two slots within a query template.
	 */
	'click .external-message .icon-wrapper .icon-exchange': function(event, instance) {
		const changeBtn = $(event.target).parent().closest('.icon-wrapper'),
			left = changeBtn.prevAll('.field-with-label'),
			right = changeBtn.nextAll('.field-with-label'),
			leftTokenIndex = parseInt(left.attr('data-token-index')),
			rightTokenIndex = parseInt(right.attr('data-token-index'));
		if(changeBtn.hasClass("spinner")) {
			return;
		}
		changeBtn.addClass("spinner");
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[left.data('parentTplIndex')].querySlots = _.map(externalMsg.result.queryTemplates[left.data('parentTplIndex')].querySlots,
			(query) => {
				if (query.tokenIndex === leftTokenIndex) {
					query.tokenIndex = rightTokenIndex;
				} else if (query.tokenIndex === rightTokenIndex) {
					query.tokenIndex = leftTokenIndex;
				}
				return query;
			});
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get(),(err) => {
			changeBtn.removeClass("spinner");
			if (err) {//TODO logging error
			}
		});
	}
});

Template.reisebuddy_externalSearch.onCreated(function () {
	this.externalMessages = new ReactiveVar([]);
	this.helpRequest = new ReactiveVar({});
	this.roomId = null;

	const self = this;
	this.autorun(() => {
		self.roomId = Template.currentData().rid;
		self.subscribe('livechat:externalMessages', self.roomId);
		const extMsg = RocketChat.models.LivechatExternalMessage.findByRoomId(self.roomId, {ts: -1}).fetch();
		if (extMsg.length > 0) {
			self.externalMessages.set(extMsg[0]);
		}

		if(self.roomId){
			self.subscribe('p2phelp:helpRequest', self.roomId);
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(self.roomId);
			self.helpRequest.set(helpRequest);

			if(!helpRequest){ //todo remove after PoC: Non-reactive method call
				Meteor.call('p2phelp:helpRequestByRoomId', self.roomId,(err, result) => {
					if(!err){
						self.helpRequest.set(result);
					} else {
						console.log(err);
					}
				});
			}
		}
	});
});
