/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
const calculateResponseTimings = (dbCursor) => {
	let art = 0;
	let longest = 0;
	let count = 0;

	dbCursor.forEach(({ metrics }) => {
		if (metrics && metrics.response && metrics.response.avg) {
			art += metrics.response.avg;
			count++;
		}
		if (metrics && metrics.response && metrics.response.ft) {
			longest = Math.max(longest, metrics.response.ft);
		}
	});

	const avgArt = count ? art / count : 0;

	return {
		avg: Math.round(avgArt * 100) / 100,
		longest,
	};
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
const calculateReactionTimings = (dbCursor) => {
	let arnt = 0;
	let longest = 0;
	let count = 0;

	dbCursor.forEach(({ metrics }) => {
		if (metrics && metrics.reaction && metrics.reaction.ft) {
			arnt += metrics.reaction.ft;
			longest = Math.max(longest, metrics.reaction.ft);
			count++;
		}
	});

	const avgArnt = count ? arnt / count : 0;

	return {
		avg: Math.round(avgArnt * 100) / 100,
		longest,
	};
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
const calculateDurationData = (dbCursor) => {
	let total = 0;
	let longest = 0;
	let count = 0;

	dbCursor.forEach(({ metrics }) => {
		if (metrics && metrics.chatDuration) {
			total += metrics.chatDuration;
			longest = Math.max(longest, metrics.chatDuration);
			count++;
		}
	});

	const avgCD = count ? total / count : 0;

	return {
		avg: Math.round(avgCD * 100) / 100,
		longest,
	};
};

/**
 * return readable time format from seconds
 * @param  {Double} sec seconds
 * @return {String}     Readable string format
 */
const secondsToHHMMSS = (sec) => {
	sec = parseFloat(sec);

	let hours = Math.floor(sec / 3600);
	let minutes = Math.floor((sec - (hours * 3600)) / 60);
	let seconds = Math.round(sec - (hours * 3600) - (minutes * 60));

	if (hours < 10) { hours = `0${ hours }`; }
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }

	if (hours > 0) {
		return `${ hours }:${ minutes }:${ seconds }`;
	}
	if (minutes > 0) {
		return `${ minutes }:${ seconds }`;
	}
	return sec;
};


/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
export const getTimingsChartData = (dbCursor) => {
	const data = {};

	data.reaction = calculateReactionTimings(dbCursor);
	data.response = calculateResponseTimings(dbCursor);
	data.chatDuration = calculateDurationData(dbCursor);

	return data;
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
export const getAgentStatusData = (dbCursor) => {
	const data = {
		offline: 0,
		available: 0,
		away: 0,
		busy: 0,
	};

	dbCursor.forEach((doc) => {
		if (doc.status === 'offline' || doc.status === 'away' || doc.status === 'busy') {
			data[doc.status]++;
		} else if (doc.status === 'online' && doc.statusLivechat === 'available') {
			data[doc.statusLivechat]++;
		} else {
			data.offline++;
		}
	});

	return data;
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Array(Object)}
 */
export const getConversationsOverviewData = (dbCursor) => {
	let total = 0;
	let totalMessages = 0;

	dbCursor.forEach(function(doc) {
		total++;
		if (doc.msgs) {
			totalMessages += doc.msgs;
		}
	});

	return [{
		title: 'Total_conversations',
		value: total || 0,
	}, {
		title: 'Total_messages',
		value: totalMessages || 0,
	}];
};


/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Array(Object)}
 */
export const getTimingsOverviewData = (dbCursor) => {
	let total = 0;
	let totalResponseTime = 0;
	let totalReactionTime = 0;

	dbCursor.forEach(function(doc) {
		total++;
		if (doc.metrics && doc.metrics.response) {
			totalResponseTime += doc.metrics.response.avg;
			totalReactionTime += doc.metrics.reaction.ft;
		}
	});

	return [{
		title: 'Avg_reaction_time',
		value: total ? secondsToHHMMSS((totalReactionTime / total).toFixed(2)) : '-',
	}, {
		title: 'Avg_response_time',
		value: total ? secondsToHHMMSS((totalResponseTime / total).toFixed(2)) : '-',
	}];
};
