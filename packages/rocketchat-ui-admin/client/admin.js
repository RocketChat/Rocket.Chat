/*globals jscolor, i18nDefaultQuery */
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

const TempSettings = new Mongo.Collection(null);

RocketChat.TempSettings = TempSettings;

const getDefaultSetting = function(settingId) {
	return RocketChat.settings.collectionPrivate.findOne({
		_id: settingId
	});
};

const setFieldValue = function(settingId, value, type, editor) {
	const input = $('.page-settings').find(`[name="${ settingId }"]`);
	switch (type) {
		case 'boolean':
			$('.page-settings').find(`[name="${ settingId }"][value="${ Number(value) }"]`).prop('checked', true).change();
			break;
		case 'code':
			input.next()[0].CodeMirror.setValue(value);
			break;
		case 'color':
			editor = value && value[0] === '#' ? 'color' : 'expression';
			input.parents('.horizontal').find('select[name="color-editor"]').val(editor).change();
			input.val(value).change();
			break;
		case 'roomPick':
			const selectedRooms = Template.instance().selectedRooms.get();
			selectedRooms[settingId] = value;
			Template.instance().selectedRooms.set(selectedRooms);
			TempSettings.update({ _id: settingId }, { $set: { value, changed: JSON.stringify(RocketChat.settings.collectionPrivate.findOne(settingId).value) !== JSON.stringify(value) } });
			break;
		default:
			input.val(value).change();
	}
};

Template.admin.onCreated(function() {
	if (RocketChat.settings.cachedCollectionPrivate == null) {
		RocketChat.settings.cachedCollectionPrivate = new RocketChat.CachedCollection({
			name: 'private-settings',
			eventType: 'onLogged'
		});
		RocketChat.settings.collectionPrivate = RocketChat.settings.cachedCollectionPrivate.collection;
		RocketChat.settings.cachedCollectionPrivate.init();
	}
	this.selectedRooms = new ReactiveVar({});
	RocketChat.settings.collectionPrivate.find().observe({
		added: (data) => {
			const selectedRooms = this.selectedRooms.get();
			if (data.type === 'roomPick') {
				selectedRooms[data._id] = data.value;
				this.selectedRooms.set(selectedRooms);
			}
			TempSettings.insert(data);
		},
		changed: (data) => {
			const selectedRooms = this.selectedRooms.get();
			if (data.type === 'roomPick') {
				selectedRooms[data._id] = data.value;
				this.selectedRooms.set(selectedRooms);
			}
			TempSettings.update(data._id, data);
		},
		removed: (data) => {
			const selectedRooms = this.selectedRooms.get();
			if (data.type === 'roomPick') {
				delete selectedRooms[data._id];
				this.selectedRooms.set(selectedRooms);
			}
			TempSettings.remove(data._id);
		}
	});
});

Template.admin.onDestroyed(function() {
	TempSettings.remove({});
});

Template.admin.helpers({
	languages() {
		const languages = TAPi18n.getLanguages();

		let result = Object.keys(languages).map(key => {
			const language = languages[key];
			return _.extend(language, { key });
		});

		result = _.sortBy(result, 'key');
		result.unshift({
			'name': 'Default',
			'en': 'Default',
			'key': ''
		});
		return result;
	},
	appLanguage(key) {
		const setting = RocketChat.settings.get('Language');
		return setting && setting.split('-').shift().toLowerCase() === key;
	},
	group() {
		const groupId = FlowRouter.getParam('group');
		const group = RocketChat.settings.collectionPrivate.findOne({
			_id: groupId,
			type: 'group'
		});
		if (!group) {
			return;
		}
		const settings = RocketChat.settings.collectionPrivate.find({ group: groupId }, { sort: { section: 1, sorter: 1, i18nLabel: 1 }}).fetch();
		const sections = {};

		Object.keys(settings).forEach(key => {
			const setting = settings[key];
			if (setting.i18nDefaultQuery != null) {
				if (_.isString(setting.i18nDefaultQuery)) {
					i18nDefaultQuery = JSON.parse(setting.i18nDefaultQuery);
				} else {
					i18nDefaultQuery = setting.i18nDefaultQuery;
				}
				if (!_.isArray(i18nDefaultQuery)) {
					i18nDefaultQuery = [i18nDefaultQuery];
				}
				Object.keys(i18nDefaultQuery).forEach(key => {
					const item = i18nDefaultQuery[key];
					if (RocketChat.settings.collectionPrivate.findOne(item) != null) {
						setting.value = TAPi18n.__(`${ setting._id }_Default`);
					}
				});
			}
			const settingSection = setting.section || '';
			if (sections[settingSection] == null) {
				sections[settingSection] = [];
			}
			sections[settingSection].push(setting);
		});

		group.sections = Object.keys(sections).map(key =>{
			const value = sections[key];
			return {
				section: key,
				settings: value
			};
		});
		return group;
	},
	i18nDefaultValue() {
		return TAPi18n.__(`${ this._id }_Default`);
	},
	isDisabled() {
		let enableQuery;
		if (this.blocked) {
			return {
				disabled: 'disabled'
			};
		}
		if (this.enableQuery == null) {
			return {};
		}
		if (_.isString(this.enableQuery)) {
			enableQuery = JSON.parse(this.enableQuery);
		} else {
			enableQuery = this.enableQuery;
		}
		if (!_.isArray(enableQuery)) {
			enableQuery = [enableQuery];
		}
		let found = 0;

		Object.keys(enableQuery).forEach(key =>{
			const item = enableQuery[key];
			if (TempSettings.findOne(item) != null) {
				found++;
			}
		});
		if (found === enableQuery.length) {
			return {};
		} else {
			return {
				disabled: 'disabled'
			};
		}
	},
	isReadonly() {
		if (this.readonly === true) {
			return {
				readonly: 'readonly'
			};
		}
	},
	hasChanges(section) {
		const group = FlowRouter.getParam('group');
		const query = {
			group,
			changed: true
		};
		if (section != null) {
			if (section === '') {
				query.$or = [
					{
						section: ''
					}, {
						section: {
							$exists: false
						}
					}
				];
			} else {
				query.section = section;
			}
		}
		return TempSettings.find(query).count() > 0;
	},
	isSettingChanged(id) {
		return TempSettings.findOne({
			_id: id
		}, {
			fields: {
				changed: 1
			}
		}).changed;
	},
	translateSection(section) {
		if (section.indexOf(':') > -1) {
			return section;
		}
		return t(section);
	},
	label() {
		const label = this.i18nLabel || this._id;
		if (label) {
			return TAPi18n.__(label);
		}
	},
	description() {
		let description;
		if (this.i18nDescription) {
			description = TAPi18n.__(this.i18nDescription);
		}
		if ((description != null) && description !== this.i18nDescription) {
			return description;
		}
	},
	sectionIsCustomOAuth(section) {
		return /^Custom OAuth:\s.+/.test(section);
	},
	callbackURL(section) {
		const id = s.strRight(section, 'Custom OAuth: ').toLowerCase();
		return Meteor.absoluteUrl(`_oauth/${ id }`);
	},
	relativeUrl(url) {
		return Meteor.absoluteUrl(url);
	},
	selectedOption(_id, val) {
		const option = RocketChat.settings.collectionPrivate.findOne({ _id });
		return option && option.value === val;
	},
	random() {
		return Random.id();
	},
	getEditorOptions(readOnly = false) {
		return {
			lineNumbers: true,
			mode: this.code || 'javascript',
			gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
			foldGutter: true,
			matchBrackets: true,
			autoCloseBrackets: true,
			matchTags: true,
			showTrailingSpace: true,
			highlightSelectionMatches: true,
			readOnly
		};
	},
	setEditorOnBlur(_id) {
		Meteor.defer(function() {
			if (!$(`.code-mirror-box[data-editor-id="${ _id }"] .CodeMirror`)[0]) {
				return;
			}
			const codeMirror = $(`.code-mirror-box[data-editor-id="${ _id }"] .CodeMirror`)[0].CodeMirror;
			if (codeMirror.changeAdded === true) {
				return;
			}
			const onChange = function() {
				const value = codeMirror.getValue();
				TempSettings.update({ _id }, { $set: { value, changed: RocketChat.settings.collectionPrivate.findOne(_id).value !== value }});
			};
			const onChangeDelayed = _.debounce(onChange, 500);
			codeMirror.on('change', onChangeDelayed);
			codeMirror.changeAdded = true;
		});
	},
	assetAccept(fileConstraints) {
		if (fileConstraints.extensions && fileConstraints.extensions.length) {
			return `.${ fileConstraints.extensions.join(', .') }`;
		}
	},
	autocompleteRoom() {
		return {
			limit: 10,
			//inputDelay: 300
			rules: [
				{
					//@TODO maybe change this 'collection' and/or template
					collection: 'CachedChannelList',
					subscription: 'channelAndPrivateAutocomplete',
					field: 'name',
					template: Template.roomSearch,
					noMatchTemplate: Template.roomSearchEmpty,
					matchAll: true,
					selector(match) {
						return {
							name: match
						};
					},
					sort: 'name'
				}
			]
		};
	},
	selectedRooms() {
		return Template.instance().selectedRooms.get()[this._id] || [];
	},
	getColorVariable(color) {
		return color.replace(/theme-color-/, '@');
	},
	showResetButton() {
		const setting = TempSettings.findOne({ _id: this._id }, { fields: { value: 1, packageValue: 1 }});
		return this.type !== 'asset' && setting.value !== setting.packageValue && !this.blocked;
	}
});

Template.admin.events({
	'change .input-monitor, keyup .input-monitor': _.throttle(function(e) {
		let value = s.trim($(e.target).val());
		switch (this.type) {
			case 'int':
				value = parseInt(value);
				break;
			case 'boolean':
				value = value === '1';
				break;
			case 'color':
				$(e.target).siblings('.colorpicker-swatch').css('background-color', value);
		}
		TempSettings.update({
			_id: this._id
		}, {
			$set: {
				value,
				changed: RocketChat.settings.collectionPrivate.findOne(this._id).value !== value
			}
		});
	}, 500),
	'change select[name=color-editor]'(e) {
		const value = s.trim($(e.target).val());
		TempSettings.update({ _id: this._id }, { $set: { editor: value }});
		RocketChat.settings.collectionPrivate.update({ _id: this._id }, { $set: { editor: value }});
	},
	'click .submit .discard'() {
		const group = FlowRouter.getParam('group');
		const query = {
			group,
			changed: true
		};
		const settings = TempSettings.find(query, {
			fields: { _id: 1, value: 1, packageValue: 1 }}).fetch();
		settings.forEach(function(setting) {
			const oldSetting = RocketChat.settings.collectionPrivate.findOne({ _id: setting._id }, { fields: { value: 1, type: 1, editor: 1 }});
			setFieldValue(setting._id, oldSetting.value, oldSetting.type, oldSetting.editor);
		});
	},
	'click .reset-setting'(e) {
		e.preventDefault();
		let settingId = $(e.target).data('setting');
		if (typeof settingId === 'undefined') {
			settingId = $(e.target).parent().data('setting');
		}
		const defaultValue = getDefaultSetting(settingId);
		setFieldValue(settingId, defaultValue.packageValue, defaultValue.type, defaultValue.editor);
	},
	'click .reset-group'(e) {
		let settings;
		e.preventDefault();
		const group = FlowRouter.getParam('group');
		const section = $(e.target).data('section');
		if (section === '') {
			settings = TempSettings.find({ group, section: { $exists: false }}, { fields: { _id: 1 }}).fetch();
		} else {
			settings = TempSettings.find({ group, section }, { fields: { _id: 1 }}).fetch();
		}
		settings.forEach(function(setting) {
			const defaultValue = getDefaultSetting(setting._id);
			setFieldValue(setting._id, defaultValue.packageValue, defaultValue.type, defaultValue.editor);
			TempSettings.update({_id: setting._id }, {
				$set: {
					value: defaultValue.packageValue,
					changed: RocketChat.settings.collectionPrivate.findOne(setting._id).value !== defaultValue.packageValue
				}
			});
		});
	},
	'click .submit .save'() {
		const group = FlowRouter.getParam('group');
		const query = { group, changed: true };
		const settings = TempSettings.find(query, { fields: { _id: 1, value: 1, editor: 1 }}).fetch();
		if (!_.isEmpty(settings)) {
			RocketChat.settings.batchSet(settings, function(err) {
				if (err) {
					return handleError(err);
				}
				TempSettings.update({ changed: true }, { $unset: { changed: 1 }});
				toastr.success(TAPi18n.__('Settings_updated'));
			});
		}
	},
	'click .submit .refresh-clients'() {
		Meteor.call('refreshClients', function() {
			toastr.success(TAPi18n.__('Clients_will_refresh_in_a_few_seconds'));
		});
	},
	'click .submit .add-custom-oauth'() {
		const config = {
			title: TAPi18n.__('Add_custom_oauth'),
			text: TAPi18n.__('Give_a_unique_name_for_the_custom_oauth'),
			type: 'input',
			showCancelButton: true,
			closeOnConfirm: true,
			inputPlaceholder: TAPi18n.__('Custom_oauth_unique_name')
		};
		swal(config, function(inputValue) {
			if (inputValue === false) {
				return false;
			}
			if (inputValue === '') {
				swal.showInputError(TAPi18n.__('Name_cant_be_empty'));
				return false;
			}
			Meteor.call('addOAuthService', inputValue, function(err) {
				if (err) {
					handleError(err);
				}
			});
		});
	},
	'click .submit .refresh-oauth'() {
		toastr.info(TAPi18n.__('Refreshing'));
		return Meteor.call('refreshOAuthService', function(err) {
			if (err) {
				return handleError(err);
			} else {
				return toastr.success(TAPi18n.__('Done'));
			}
		});
	},
	'click .submit .remove-custom-oauth'() {
		const name = this.section.replace('Custom OAuth: ', '');
		const config = {
			title: TAPi18n.__('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: TAPi18n.__('Yes_delete_it'),
			cancelButtonText: TAPi18n.__('Cancel'),
			closeOnConfirm: true
		};
		swal(config, function() {
			Meteor.call('removeOAuthService', name);
		});
	},
	'click .delete-asset'() {
		Meteor.call('unsetAsset', this.asset);
	},
	'change input[type=file]'(ev) {
		const e = ev.originalEvent || ev;
		let files = e.target.files;
		if (!files || files.length === 0) {
			if (e.dataTransfer && e.dataTransfer.files) {
				files = e.dataTransfer.files;
			} else {
				files = [];
			}
		}

		Object.keys(files).forEach(key => {
			const blob = files[key];
			toastr.info(TAPi18n.__('Uploading_file'));
			const reader = new FileReader();
			reader.readAsBinaryString(blob);
			reader.onloadend = () => {
				return Meteor.call('setAsset', reader.result, blob.type, this.asset, function(err) {
					if (err != null) {
						handleError(err);
						console.log(err);
						return;
					}
					return toastr.success(TAPi18n.__('File_uploaded'));
				});
			};
		});
	},
	'click .expand'(e) {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
		$('.CodeMirror').each(function(index, codeMirror) {
			codeMirror.CodeMirror.refresh();
		});
	},
	'click .collapse'(e) {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	},
	'click button.action'() {
		if (this.type !== 'action') {
			return;
		}
		Meteor.call(this.value, function(err, data) {
			if (err != null) {
				err.details = _.extend(err.details || {}, {
					errorTitle: 'Error'
				});
				handleError(err);
				return;
			}
			const args = [data.message].concat(data.params);
			toastr.success(TAPi18n.__.apply(TAPi18n, args), TAPi18n.__('Success'));
		});
	},
	'click .button-fullscreen'() {
		const codeMirrorBox = $(`.code-mirror-box[data-editor-id="${ this._id }"]`);
		codeMirrorBox.addClass('code-mirror-box-fullscreen content-background-color');
		codeMirrorBox.find('.CodeMirror')[0].CodeMirror.refresh();
	},
	'click .button-restore'() {
		const codeMirrorBox = $(`.code-mirror-box[data-editor-id="${ this._id }"]`);
		codeMirrorBox.removeClass('code-mirror-box-fullscreen content-background-color');
		codeMirrorBox.find('.CodeMirror')[0].CodeMirror.refresh();
	},
	'autocompleteselect .autocomplete'(event, instance, doc) {
		const selectedRooms = instance.selectedRooms.get();
		selectedRooms[this.id] = (selectedRooms[this.id] || []).concat(doc);
		instance.selectedRooms.set(selectedRooms);
		const value = selectedRooms[this.id];
		TempSettings.update({ _id: this.id }, { $set: { value }});
		event.currentTarget.value = '';
		event.currentTarget.focus();
	},
	'click .remove-room'(event, instance) {
		const docId = this._id;
		const settingId = event.currentTarget.getAttribute('data-setting');
		const selectedRooms = instance.selectedRooms.get();
		selectedRooms[settingId] = _.reject(selectedRooms[settingId] || [], function(setting) {
			return setting._id === docId;
		});
		instance.selectedRooms.set(selectedRooms);
		const value = selectedRooms[settingId];
		TempSettings.update({ _id: settingId }, {
			$set: {
				value
			}
		});
	}
});

Template.admin.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
	Tracker.autorun(function() {
		const hasColor = TempSettings.find({
			group: FlowRouter.getParam('group'),
			type: 'color'
		}, { fields: { _id: 1, editor: 1 }}).fetch().length;
		if (hasColor) {
			Meteor.setTimeout(function() {
				$('.colorpicker-input').each(function(index, el) {
					if (!el._jscLinkedInstance) {
						new jscolor(el); //eslint-disable-line
					}
				});
			}, 400);
		}
	});
});
