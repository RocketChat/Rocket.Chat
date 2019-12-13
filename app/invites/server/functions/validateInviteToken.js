export const validateInviteToken = (inviteData, room) => {
	if (!inviteData) {
		return false;
	}

	if (!room) {
		return false;
	}

	if (inviteData.expires && inviteData.expires <= Date.now()) {
		return false;
	}

	if (inviteData.maxUses > 0 && inviteData.uses >= inviteData.maxUses) {
		return false;
	}

	return true;
};
