import moment from 'moment';
import Chart from 'chart.js/src/chart.js';

RocketChat.Livechat = {};

class Analytics {
	constructor() {
		this.chartConfiguration = {
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
				displayColors: false // hide color box
			},
			scales: {
				xAxes: [{
					scaleLabel: {
						display: false
					},
					gridLines: {
						display: true,
						color: 'rgba(0, 0, 0, 0.03)'
					}
				}],
				yAxes: [{
					scaleLabel: {
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

		// analytics all options and their associated chart/overview options
		this.analyticsAllOptions = [{
			name: 'Conversations',
			value: 'conversations',
			chartOptions: [{
				name: 'Total_conversations',
				value: 'total-conversations'
			}, {
				name: 'Avg_chat_duration',
				value: 'avg-chat-duration'
			}]
		}, {
			name: 'Productivity',
			value: 'productivity',
			chartOptions: [{
				name: 'First_response_time',
				value: 'first-response-time'
			}, {
				name: 'Avg_response_time',
				value: 'avg-response-time'
			}, {
				name: 'Avg_reaction_time',
				value: 'avg-reaction-time'
			}]
		}];
	}

	getChartConfiguration() {
		return this.chartConfiguration;
	}

	getAnalyticsAllOptions() {
		return this.analyticsAllOptions;
	}

	/**
	 *
	 * @param {Array} arr
	 * @param {Integer} chunkCount
	 *
	 * @returns {Array{Array}} Array containing arrays
	 */
	chunkArray(arr, chunkCount) {	// split array into n almost equal arrays
		const chunks = [];
		while (arr.length) {
			const chunkSize = Math.ceil(arr.length / chunkCount--);
			const chunk = arr.slice(0, chunkSize);
			chunks.push(chunk);
			arr = arr.slice(chunkSize);
		}
		return chunks;
	}

	/**
	 *
	 * @param {Object} chart - chart element
	 * @param {Object} chartContext - Context of chart
	 * @param {String} chartLabel
	 * @param {Array(String)} dataLabels
	 * @param {Array(Double)} dataPoints
	 */
	drawLineChart(chart, chartContext, chartLabel, dataLabels, dataPoints) {
		if (chartContext) {
			chartContext.destroy();
		}

		return new Chart(chart, {
			type: 'line',
			data: {
				labels: dataLabels,		// data labels, y-axis points
				datasets: [{
					label: TAPi18n.__(chartLabel),	// chart label
					data: dataPoints,		// data points corresponding to data labels, x-axis points
					backgroundColor: [
						'rgba(255, 99, 132, 0.2)'
					],
					borderColor: [
						'#1d74f5'
					],
					borderWidth: 3,
					fill: false
				}]
			},
			options: this.getChartConfiguration()
		});
	}
	/**
	 *	Check if given daterange matches any of pre-defined options
	 * @param {String} value
	 * @param {Date} from
	 * @param {Date} to
	 *
	 * @returns {String} new value
	 */
	checkDaterangeValue(value, from, to) {
		if (moment().startOf('day').isSame(from) && moment().startOf('day').isSame(to)) {
			return 'today';
		}
		if (moment().startOf('day').subtract(1, 'days').isSame(from) && moment().startOf('day').subtract(1, 'days').isSame(from)) {
			return 'yesterday';
		}
		if (moment().startOf('week').isSame(from) && moment().endOf('week').isSame(to)) {
			return 'this-week';
		}
		if (moment().subtract(1, 'weeks').startOf('week').isSame(from) && moment().subtract(1, 'weeks').endOf('week').isSame(to)) {
			return 'prev-week';
		}
		if (moment().startOf('month').isSame(from) && moment().endOf('month').isSame(to)) {
			return 'this-month';
		}
		if (moment().subtract(1, 'months').startOf('month').isSame(from) && moment().subtract(1, 'months').endOf('month').isSame(to)) {
			return 'prev-month';
		}
		return value;
	}

	/**
	 * Update ReactiVar to daterange provided
	 * @param {ReactiveVar} daterange
	 * @param {String} value
	 * @param {Date} from
	 * @param {Date} to
	 */
	setDateRange(daterange, value, from, to) {
		if (moment(from).isAfter(moment())) {
			return handleError({details: {errorTitle: 'Invalid_dates'}, error: 'Start_date_incorrect'});
		}

		if (value && from && to) {
			value = this.checkDaterangeValue(value, from, to);

			daterange.set({
				value,
				from: moment(from).format('MMM D YYYY'),
				to: moment(to).format('MMM D YYYY')
			});
		} else {
			daterange.set({
				value: 'this-week',
				from: moment().startOf('week').format('MMM D YYYY'),
				to: moment().endOf('week').format('MMM D YYYY')
			});
		}
	}

	/**
	 * Inc/Dec ReactiVar Daterange by one unit.
	 * @param {ReactiveVar} daterange
	 * @param {Int} order
	 */
	updateDateRange(daterange, order) {
		const currentDaterange = daterange.get();

		switch (currentDaterange.value) {
			case 'today':
			case 'yesterday':
			case 'day':
				if (order === 1) {
					this.setDateRange(daterange, 'day',
						moment(new Date(currentDaterange.from)).add(1, 'days').startOf('day'),
						moment(new Date(currentDaterange.to)).add(1, 'days').startOf('day'));
				} else {
					this.setDateRange(daterange, 'day',
						moment(new Date(currentDaterange.from)).subtract(1, 'days').startOf('day'),
						moment(new Date(currentDaterange.to)).subtract(1, 'days').startOf('day'));
				}
				break;
			case 'this-week':
			case 'prev-week':
			case 'week':
				if (order === 1) {
					this.setDateRange(daterange, 'week',
						moment(new Date(currentDaterange.from)).add(1, 'weeks').startOf('week'),
						moment(new Date(currentDaterange.to)).add(1, 'weeks').endOf('week'));
				} else {
					this.setDateRange(daterange, 'week',
						moment(new Date(currentDaterange.from)).subtract(1, 'weeks').startOf('week'),
						moment(new Date(currentDaterange.to)).subtract(1, 'weeks').endOf('week'));
				}
				break;
			case 'this-month':
			case 'prev-month':
			case 'month':
				if (order === 1) {
					this.setDateRange(daterange, 'month',
						moment(new Date(currentDaterange.from)).add(1, 'months').startOf('month'),
						moment(new Date(currentDaterange.to)).add(1, 'months').endOf('month'));
				} else {
					this.setDateRange(daterange, 'month',
						moment(new Date(currentDaterange.from)).subtract(1, 'months').startOf('month'),
						moment(new Date(currentDaterange.to)).subtract(1, 'months').endOf('month'));
				}
				break;
			case 'custom':
				handleError({details: {errorTitle: 'Navigation_didnot_work'}, error: 'You_have_selected_custom_dates'});
		}
	}
}

RocketChat.Livechat.Analytics = new Analytics();
