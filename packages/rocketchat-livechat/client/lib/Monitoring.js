import Chart from 'chart.js/src/chart.js';

RocketChat.Livechat.Monitoring = {
	getLineChartConfiguration() {
		return {
			layout: {
				padding: {
					top: 0,
					bottom: 0
				}
			},
			legend: {
				display: true,
				labels: {
					boxWidth: 20,
					fontSize: 8
				}
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
					},
					ticks: {
						fontSize: 8
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
						beginAtZero: true,
						fontSize: 8
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
			maintainAspectRatio: false,
			responsiveAnimationDuration: 0 // animation duration after a resize
		};
	},

	/**
	 *
	 * @param {Object} chart - chart element
	 * @param {Object} chartContext - Context of chart
	 * @param {Array(String)} chartLabel
	 * @param {Array(String)} dataLabels
	 * @param {Array(Array(Double))} dataPoints
	 */
	drawLineChart(chart, chartContext, chartLabels, dataLabels, dataSets) {
		if (chartContext) {
			chartContext.destroy();
		}
		const colors = [
			'#2de0a5',
			'#ffd21f',
			'#f5455c',
			'#cbced1'
		];

		const datasets = [];

		chartLabels.forEach(function(chartLabel, index) {
			datasets.push({
				label: TAPi18n.__(chartLabel),	// chart label
				data: dataSets[index],		// data points corresponding to data labels, x-axis points
				backgroundColor: [
					colors[index]
				],
				borderColor: [
					colors[index]
				],
				borderWidth: 3,
				fill: false
			});
		});

		return new Chart(chart, {
			type: 'line',
			data: {
				labels: dataLabels,		// data labels, y-axis points
				datasets
			},
			options: this.getLineChartConfiguration()
		});
	},

	/**
	 *
	 * @param {Object} chart - chart element
	 * @param {Object} chartContext - Context of chart
	 * @param {Array(String)} dataLabels
	 * @param {Array(Double)} dataPoints
	 */
	drawDoughnutChart(chart, title, chartContext, dataLabels, dataPoints) {
		if (chartContext) {
			chartContext.destroy();
		}

		return new Chart(chart, {
			type: 'doughnut',
			data: {
				labels: dataLabels,		// data labels, y-axis points
				datasets: [{
					data: dataPoints,		// data points corresponding to data labels, x-axis points
					backgroundColor: [
						'#2de0a5',
						'#ffd21f',
						'#f5455c',
						'#cbced1'
					],
					borderWidth: 0
				}]
			},
			options: {
				layout: {
					padding: {
						top: 0,
						bottom: 0
					}
				},
				legend: {
					display: true,
					position: 'right',
					labels: {
						boxWidth: 20,
						fontSize: 8
					}
				},
				title: {
					display: 'true',
					text: title
				},
				tooltips: {
					enabled: true,
					mode: 'point',
					displayColors: false // hide color box
				},
				animation: {
					duration: 0 // general animation time
				},
				hover: {
					animationDuration: 0 // duration of animations when hovering an item
				},
				responsive: true,
				maintainAspectRatio: false,
				responsiveAnimationDuration: 0 // animation duration after a resize
			}
			// options: this.getChartConfiguration()
		});
	},

	/**
	 * Update chart
	 * @param  {Object} chart [Chart context]
	 * @param  {String} label [chart label]
	 * @param  {Array(Double)} data  [updated data]
	 */
	updateChart(chart, label, data) {
		if (chart.data.labels.indexOf(label) === -1) {
			// insert data
			chart.data.labels.push(label);
			chart.data.datasets.forEach((dataset, idx) => {
				dataset.data.push(data[idx]);
			});
		} else {
			// update data
			const index = chart.data.labels.indexOf(label);
			chart.data.datasets.forEach((dataset, idx) => {
				dataset.data[index] = data[idx];
			});
		}

		chart.update();
	},

	/**
	 * checks if value changed or not
	 * @param  {Object}  oldValue [Old value]
	 * @param  {Object}  newValue [new value, may be updated]
	 * @return {Boolean}          [description]
	 */
	isChanged(oldValue, newValue) {
		if (!newValue) {
			return false;
		}

		if (oldValue === newValue) {
			return false;
		}

		return true;
	},

	calculateResponseTimings(dbCursor) {
		let art = 0;
		let longest = 0;
		let count = 0;

		dbCursor.forEach(({metrics}) => {
			if (metrics && metrics.response && metrics.response.avg) {
				art += metrics.response.avg;
				count++;
			}
			if (metrics && metrics.response && metrics.response.ft) {
				longest = Math.max(longest, metrics.response.ft);
			}
		});

		const avgArt = (count) ? art/count : 0;

		return {
			avg: Math.round(avgArt*100)/100,
			longest
		};
	},

	calculateReactionTimings(dbCursor) {
		let arnt = 0;
		let longest = 0;
		let count = 0;

		dbCursor.forEach(({metrics}) => {
			if (metrics && metrics.reaction && metrics.reaction.ft) {
				arnt += metrics.reaction.ft;
				longest = Math.max(longest, metrics.reaction.ft);
				count++;
			}
		});

		const avgArnt = (count) ? arnt/count : 0;

		return {
			avg: Math.round(avgArnt*100)/100,
			longest
		};
	},

	calculateDurationData(dbCursor) {
		let total = 0;
		let longest = 0;
		let count = 0;

		dbCursor.forEach(({metrics}) => {
			if (metrics && metrics.chatDuration) {
				total += metrics.chatDuration;
				longest = Math.max(longest, metrics.chatDuration);
				count++;
			}
		});

		const avgCD = (count) ? total/count : 0;

		return {
			avg: Math.round(avgCD*100)/100,
			longest
		};
	},

	getChartData(dbCursor) {
		const data = {};

		data.reaction = this.calculateReactionTimings(dbCursor);
		data.response = this.calculateResponseTimings(dbCursor);
		data.chatDuration = this.calculateDurationData(dbCursor);

		return data;
	},

	getAgentStatusData(dbCursor) {
		const data = {
			offline: 0,
			online: 0,
			away: 0,
			busy: 0
		};

		dbCursor.forEach((doc) => {
			if (doc.status === 'offline' || doc.status === 'online' || doc.status === 'away' || doc.status === 'busy') {
				data[doc.status]++;
			} else {
				data['offline']++;
			}
		});

		return data;
	}
};
