import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { handleError } from '/app/utils';
import { popover } from '/app/ui-utils';
import moment from 'moment';
import { drawLineChart } from '../../../lib/chartHandler';
import { setDateRange, updateDateRange } from '../../../lib/dateHandler';

let templateInstance;		// current template instance/context
let chartContext;			// stores context of current chart, used to clean when redrawing

const analyticsAllOptions = () => [{
	name: 'Conversations',
	value: 'conversations',
	chartOptions: [{
		name: 'Total_conversations',
		value: 'total-conversations',
	}, {
		name: 'Avg_chat_duration',
		value: 'avg-chat-duration',
	}, {
		name: 'Total_messages',
		value: 'total-messages',
	}],
}, {
	name: 'Productivity',
	value: 'productivity',
	chartOptions: [{
		name: 'Avg_first_response_time',
		value: 'avg-first-response-time',
	}, {
		name: 'Best_first_response_time',
		value: 'best_first_response_time',
	}, {
		name: 'Avg_response_time',
		value: 'avg-response-time',
	}, {
		name: 'Avg_reaction_time',
		value: 'avg-reaction-time',
	}],
}];

/**
 *
 * @param {Array} arr
 * @param {Integer} chunkCount
 *
 * @returns {Array{Array}} Array containing arrays
 */
const chunkArray = (arr, chunkCount) => {	// split array into n almost equal arrays
	const chunks = [];
	while (arr.length) {
		const chunkSize = Math.ceil(arr.length / chunkCount--);
		const chunk = arr.slice(0, chunkSize);
		chunks.push(chunk);
		arr = arr.slice(chunkSize);
	}
	return chunks;
};

const updateAnalyticsChart = () => {
	const options = {
		daterange: {
			from: moment(templateInstance.daterange.get().from, 'MMM D YYYY').toISOString(),
			to: moment(templateInstance.daterange.get().to, 'MMM D YYYY').toISOString(),
		},
		chartOptions: templateInstance.chartOptions.get(),
	};

	Meteor.call('livechat:getAnalyticsChartData', options, function(error, result) {
		if (error) {
			return handleError(error);
		}

		if (!(result && result.chartLabel && result.dataLabels && result.dataPoints)) {
			console.log('livechat:getAnalyticsChartData => Missing Data');
		}

		chartContext = drawLineChart(document.getElementById('lc-analytics-chart'), chartContext, [result.chartLabel], result.dataLabels, [result.dataPoints]);
	});

	Meteor.call('livechat:getAgentOverviewData', options, function(error, result) {
		if (error) {
			return handleError(error);
		}

		if (!result) {
			console.log('livechat:getAgentOverviewData => Missing Data');
		}

		templateInstance.agentOverviewData.set(result);
	});
};

const updateAnalyticsOverview = () => {
	const options = {
		daterange: {
			from: moment(templateInstance.daterange.get().from, 'MMM D YYYY').toISOString(),
			to: moment(templateInstance.daterange.get().to, 'MMM D YYYY').toISOString(),
		},
		analyticsOptions: templateInstance.analyticsOptions.get(),
	};

	Meteor.call('livechat:getAnalyticsOverviewData', options, (error, result) => {
		if (error) {
			return handleError(error);
		}

		if (!result) {
			console.log('livechat:getAnalyticsOverviewData => Missing Data');
		}

		templateInstance.analyticsOverviewData.set(chunkArray(result, 3));
	});
};

Template.livechatAnalytics.helpers({
	analyticsOverviewData() {
		return templateInstance.analyticsOverviewData.get();
	},
	agentOverviewData() {
		return templateInstance.agentOverviewData.get();
	},
	analyticsAllOptions() {
		return analyticsAllOptions();
	},
	analyticsOptions() {
		return templateInstance.analyticsOptions.get();
	},
	daterange() {
		return templateInstance.daterange.get();
	},
	selected(value) {
		if (value === templateInstance.analyticsOptions.get().value || value === templateInstance.chartOptions.get().value) { return 'selected'; }
		return false;
	},
	showLeftNavButton() {
		if (templateInstance.daterange.get().value === 'custom') {
			return false;
		}
		return true;
	},
	showRightNavButton() {
		if (templateInstance.daterange.get().value === 'custom' || templateInstance.daterange.get().value === 'today' || templateInstance.daterange.get().value === 'this-week' || templateInstance.daterange.get().value === 'this-month') {
			return false;
		}
		return true;
	},
});


Template.livechatAnalytics.onCreated(function() {
	templateInstance = Template.instance();

	this.analyticsOverviewData = new ReactiveVar();
	this.agentOverviewData = new ReactiveVar();
	this.daterange = new ReactiveVar({});
	this.analyticsOptions = new ReactiveVar(analyticsAllOptions()[0]);		// default selected first
	this.chartOptions = new ReactiveVar(analyticsAllOptions()[0].chartOptions[0]);		// default selected first

	this.autorun(() => {
		templateInstance.daterange.set(setDateRange());
	});
});

Template.livechatAnalytics.onRendered(() => {
	Tracker.autorun(() => {
		if (templateInstance.daterange.get() && templateInstance.analyticsOptions.get() && templateInstance.chartOptions.get()) {
			updateAnalyticsOverview();
			updateAnalyticsChart();
		}

	});

});

Template.livechatAnalytics.events({
	'click .lc-date-picker-btn'(e) {
		e.preventDefault();
		const options = [];
		const config = {
			template: 'livechatAnalyticsDaterange',
			currentTarget: e.currentTarget,
			data: {
				options,
				daterange: templateInstance.daterange,
			},
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
	'click .lc-daterange-prev'(e) {
		e.preventDefault();

		templateInstance.daterange.set(updateDateRange(templateInstance.daterange.get(), -1));
	},
	'click .lc-daterange-next'(e) {
		e.preventDefault();

		templateInstance.daterange.set(updateDateRange(templateInstance.daterange.get(), 1));
	},
	'change #lc-analytics-options'(e) {
		e.preventDefault();

		templateInstance.analyticsOptions.set(analyticsAllOptions().filter(function(obj) {
			return obj.value === e.currentTarget.value;
		})[0]);
		templateInstance.chartOptions.set(templateInstance.analyticsOptions.get().chartOptions[0]);
	},
	'change #lc-analytics-chart-options'(e) {
		e.preventDefault();

		templateInstance.chartOptions.set(templateInstance.analyticsOptions.get().chartOptions.filter(function(obj) {
			return obj.value === e.currentTarget.value;
		})[0]);
	},
});
