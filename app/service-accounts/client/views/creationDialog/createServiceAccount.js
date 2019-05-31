import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { AutoComplete } from 'meteor/mizzao:autocomplete';
import toastr from 'toastr';
import _ from 'underscore';

import { settings } from '../../../../settings';
import { callbacks } from '../../../../callbacks';
import { t, roomTypes } from '../../../../utils';
import { hasAllPermission } from '../../../../authorization';
import './createServiceAccount.html';

Template.createServiceAccount.helpers({

});

Template.createServiceAccount.events({

});