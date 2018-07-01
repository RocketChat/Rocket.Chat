/* globals popover */

import moment from 'moment';
import Chart from 'chart.js/src/chart.js';

let templateInstance;		// current template instance/context
let chartContext;

const chartConfiguration = {
	layout: {
		padding: {
			top: 10
		}
	},
	legend: {
		display: false
	},
	title: {
		display: false
	},
	tooltips: {
		enabled: true,
		mode: 'point',
		displayColors: false			// hide color box
	},
	scales: {
		xAxes: [{
			scaleLabel:{
				display: false
			},
			gridLines: {
				display: true,
				color: 'rgba(0, 0, 0, 0.03)'
			}
		}],
		yAxes: [{
			scaleLabel:{
				display: false
			},
			gridLines: {
				display: true,
				color: 'rgba(0, 0, 0, 0.03)'
			},
			ticks: {
				beginAtZero: true
			}
		}]
	},
	animation: {
		duration: 0 // general animation time
	},
	hover: {
		animationDuration: 0 // duration of animations when hovering an item
	},
	responsive: true,
	responsiveAnimationDuration: 0 // animation duration after a resize
};

const analyticsAllOptions = [{
	name: 'Conversations',
	value: 'conversations',
	chartOptions: [{
		name: 'Total Conversations',
		value: 'total-conversations'
	}],
	analyticsOptions: [[{
		title: 'Total Conversations'
	}, {
		title: 'Open Conversations'
	}], [{
		title: 'Total Messages'
	}, {
		title: 'Busiest Day'
	}], [{
		title: 'Conversations per day'
	}, {
		title: 'Busiest Time'
	}]]
}, {
	name: 'Productivity',
	value: 'productivity',
	chartOptions: [{
		name: 'First resposnse time',
		value: 'first-response-time'
	}, {
		name: 'Avg Resposnse time',
		value: 'avg-response-time'
	}, {
		name: 'Avg Reaction time',
		value: 'avg-reaction-time'
	}],
	analyticsOptions: [[{
		title: 'Response Time'
	}], [{
		title: 'First Response Time'
	}], [{
		title: 'Reaction Time'
	}]]
}];


function drawLineChart(chartLabel, dataLabels, dataPoints) {
	const chart = document.getElementById('lc-analytics-chart');

	if (chartContext) {
		chartContext.destroy();
	}

	chartContext = new Chart(chart, {
		type: 'line',
		data: {
			labels: dataLabels,		// data labels, y-axis points
			datasets: [{
				label: chartLabel,	// chart label
				data: dataPoints,		// data points corresponding to data labels, x-axis points
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)'
				],
				borderColor: [
					'rgba(255,99,132,1)'
				],
				borderWidth: 2,
				fill: false
			}]
		},
		options: chartConfiguration
	});
}

function updateAnalyticsChart() {
	console.log('updating chart ******');

	Meteor.call('livechat:getAnalyticsChartData', {daterange: templateInstance.daterange.get(), chartOptions: templateInstance.analyticsOptions.get().chartOptions}, function(error, result) {
		if (error) {
			return handleError(error);
		}

		drawLineChart(result.chartLabel, result.dataLabels, result.dataPoints);
	});
}

function updateAnalyticsOverview() {
	console.log('updating overview ******');

	Meteor.call('livechat:getAnalyticsOverviewData', {daterange: templateInstance.daterange.get(), analyticsOptions: templateInstance.analyticsOptions.get().analyticsOptions}, (error, result) => {
		if (error) {
			return handleError(error);
		}

		templateInstance.analyticsOverviewData.set(result);
	});
}

function setDateRange(value, from, to) {
	console.log('---------------- setdr called ................');
	if (value && from && to) {
		templateInstance.daterange.set({value, from, to});
	} else {
		templateInstance.daterange.set({
			value: 'this-week',
			from: moment().startOf('week').format('MMM D YYYY'),
			to: moment().format('MMM D YYYY')
		});
	}
}

function updateDateRange(order) {
	console.log('updating datarange]]]]]]]]]]]');
	const currentDaterange = templateInstance.daterange.get();

	switch (currentDaterange.value) {
		case 'this-week' || 'prev-week':
			if (order === 1) {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).add(1, 'weeks').startOf('week').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).add(1, 'weeks').endOf('week').format('MMM D YYYY'));
			} else {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).subtract(1, 'weeks').startOf('week').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).subtract(1, 'weeks').endOf('week').format('MMM D YYYY'));
			}
			break;
		case 'this-month' || 'prev-month':
			if (order === 1) {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).add(1, 'months').startOf('month').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).add(1, 'months').endOf('month').format('MMM D YYYY'));
			} else {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).subtract(1, 'months').startOf('month').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).subtract(1, 'months').endOf('month').format('MMM D YYYY'));
			}
			break;
	}
}

Template.livechatAnalytics.helpers({
	analyticsOverviewData() {
		return templateInstance.analyticsOverviewData.get();
	},
	analyticsAllOptions() {
		return analyticsAllOptions;
	},
	// chartOptions() {
	// 	return Template.instance().chartOptions.get();
	// },
	analyticsOptions() {
		return templateInstance.analyticsOptions.get();
	},
	daterange() {
		return templateInstance.daterange.get();
	},
	selected(value) {
		console.log('check if selected?');
		console.log(value);
		if (value === templateInstance.analyticsOptions.get().value || value === templateInstance.chartOptions.get().value) { return 'selected'; }
		return false;
	}
});



Template.livechatAnalytics.onCreated(function() {
	templateInstance = Template.instance();

	console.log('Main template rendered!!');
	this.analyticsOverviewData = new ReactiveVar();
	this.daterange = new ReactiveVar({});
	this.analyticsOptions = new ReactiveVar(analyticsAllOptions[0]);
	this.chartOptions = new ReactiveVar(analyticsAllOptions[0].chartOptions[0]);

	this.autorun(() => {
		setDateRange();

		// this.chartOptions.set(analyticsAllOptions.filter(function(obj) {
		// 	return obj.selected && obj.selected === true;
		// })[0].chartOptions);


	});
});

Template.livechatAnalytics.onRendered(() => {
	const elem = document.getElementById('lc-analytics-options');
	const analyticsOption = elem.options[elem.selectedIndex].value;
	console.log(`Selected value: ${ analyticsOption }`);

	console.log(moment().startOf('week').format('MMM D YYYY'));
	console.log(moment().format('MMM D YYYY'));

	Tracker.autorun(() => {
		console.log('autorun tracker -----------');
		// console.log(templateInstance.daterange.get());
		// console.log('autorun tracker ==========');
		// console.log(templateInstance.analyticsOptions.get());
		if (templateInstance.daterange.get() && templateInstance.analyticsOptions.get()) {
			// updateAnalyticsChart();
			updateAnalyticsOverview();
		}

	});

	Tracker.autorun(() => {
		// console.log('autorun tracker -----------');
		// console.log(templateInstance.daterange.get());
		console.log('autorun tracker ==========');
		// console.log(templateInstance.analyticsOptions.get());

		if (templateInstance.chartOptions.get()) {
			updateAnalyticsChart();
		}
	});
});

Template.livechatAnalytics.events({
	'click .lc-date-picker-btn'(e) {
		e.preventDefault();
		//alert('pick date');
		const options = [];
		const config = {
			template: 'livechatAnalyticsDaterange',
			currentTarget: e.currentTarget,
			data: {
				options,
				daterange: templateInstance.daterange
			},
			offsetVertical: e.currentTarget.clientHeight + 10
		};
		popover.open(config);
	},
	'click .lc-daterange-prev'(e) {
		e.preventDefault();

		updateDateRange(-1);
	},
	'click .lc-daterange-next'(e) {
		e.preventDefault();

		updateDateRange(1);
	},
	'change #lc-analytics-options'({currentTarget}) {

		templateInstance.analyticsOptions.set(analyticsAllOptions.filter(function(obj) {
			return obj.value === currentTarget.value;
		})[0]);

		// updateAnalyticsChart();
		// updateAnalyticsOverview();
	},
	'change #lc-analytics-chart-options'({currentTarget}) {
		// console.log('changed chart input');
		// console.log(currentTarget.value);

		templateInstance.chartOptions.set(templateInstance.analyticsOptions.get().chartOptions.filter(function(obj) {
			return obj.value === currentTarget.value;
		})[0]);

		// updateAnalyticsChart();
	}
});

//
// Template.livechatAnalytics.onRendered(function() {
// 	console.log('Chart options:');
// 	console.log(templateInstance.analyticsOptions.get().chartOptions);
//
// 	updateAnalyticsChart();
// 	updateAnalyticsOverview();
// });
