import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import s from 'underscore.string';

import { t, handleError } from '../../../utils';

Template.oembedEdit.helpers({
	oembed() {
		return Template.instance().oembed;
	},

	endPoint() {
		return this.endPoint;
	},

	join(a) {
		if (Array.isArray(a)) {
			return a.join('\n');
		}
		return a;
	},
});

Template.oembedEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.cancel(t.find('form'));
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	},
});

Template.oembedEdit.onCreated(function() {
	if (this.data != null) {
		this.oembed = this.data.oembed;
	} else {
		this.oembed = undefined;
	}

	this.tabBar = Template.currentData().tabBar;
	this.onSuccess = Template.currentData().onSuccess;

	this.cancel = (form, endPoint) => {
		form.reset();
		this.tabBar.close();
		if (this.oembed) {
			this.data.back(endPoint);
		}
	};

	this.getOembedData = () => {
		const oembedData = {};
		if (this.oembed != null) {
			oembedData._id = this.oembed._id;
			oembedData.previousEndPoint = this.oembed.endPoint;
		}
		oembedData.urls = s.trim(this.$('#urls').val());
		oembedData.endPoint = s.trim(this.$('#endPoint').val());
		return oembedData;
	};

	this.validate = () => {
		const oembedData = this.getOembedData();

		const errors = [];
		if (!oembedData.endPoint) {
			errors.push('EndPoint');
		}

		for (const error of errors) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (this.validate()) {
			const oembedData = this.getOembedData();

			Meteor.call('insertOrUpdateOembed', oembedData, (error, result) => {
				if (result) {
					if (oembedData._id) {
						toastr.success(t('OEmbed_Updated_Successfully'));
					} else {
						toastr.success(t('OEmbed_Added_Successfully'));
					}
					this.onSuccess();

					this.cancel(form, oembedData.endPoint);
				}

				if (error) {
					console.log(error);
					handleError(error);
				}
			});
		}
	};
});
