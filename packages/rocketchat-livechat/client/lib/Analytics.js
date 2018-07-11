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
}

RocketChat.Livechat.Analytics = new Analytics();
