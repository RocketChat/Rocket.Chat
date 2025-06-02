import type { ILivechatTag } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import TagEdit from './TagEdit';
import TagEditWithDepartmentData from './TagEditWithDepartmentData';
import { ContextualbarSkeletonBody } from '../../components/Contextualbar';

const TagEditWithData = ({ tagId, onClose }: { tagId: ILivechatTag['_id']; onClose: () => void }) => {
	const { t } = useTranslation();

	const getTagById = useEndpoint('GET', '/v1/livechat/tags/:tagId', { tagId });
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getTagById', tagId],
		queryFn: async () => getTagById(),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	if (data?.departments && data.departments.length > 0) {
		return <TagEditWithDepartmentData tagData={data} onClose={onClose} />;
	}

	return <TagEdit tagData={data} onClose={onClose} />;
};

export default TagEditWithData;
