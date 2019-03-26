import { Messages } from '../../../models';

export const reply = ({ tmid }, { ts, u }) => {
	if (!tmid) {
		return false;
	}

	const update = {
		$addToSet: {
			replies: u._id,
		},
		$set: {
			tlm: ts,
		},
		$inc: {
			tcount: 1,
		},
	};

	return Messages.update({
		_id: tmid,
	}, update);
};

export const undoReply = ({ tmid }) => {
	if (!tmid) {
		return false;
	}
	const { ts } = Messages.findOne({ tmid }, { fields: { ts: 1 }, sort: { ts: 1 } }) || {};

	const update = ts ? {
		$set: {
			tlm: ts,
		},
		$inc: {
			tcount: -1,
		},
	} : {
		$unset: {
			tcount: 1,
			tlm: 1,
			replies: 1,
		},
	};

	return Messages.update({
		_id: tmid,
	}, update);
};




export const follow = ({ tmid, uid }) => {
	if (!tmid || !uid) {
		return false;
	}

	const update = {
		$addToSet: {
			replies: uid,
		},
	};

	return Messages.update({
		_id: tmid,
	}, update);
};

export const unfollow = ({ tmid, uid }) => {
	if (!tmid || !uid) {
		return false;
	}

	const update = {
		$pull: {
			replies: uid,
		},
	};

	return Messages.update({
		_id: tmid,
	}, update);
};
