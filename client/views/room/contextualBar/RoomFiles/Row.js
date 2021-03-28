import React, { memo } from 'react';

import FileItem from './components/FileItem';

const Row = ({ item, data, index }) => {
	const { userId, onClickDelete, isDeletionAllowed } = data;

	return (
		item && (
			<FileItem
				index={index}
				_id={item._id}
				name={item.name}
				url={item.url}
				uploadedAt={item.uploadedAt}
				user={item.user}
				ts={item.ts}
				type={item.type}
				typeGroup={item.typeGroup}
				fileData={item}
				userId={userId}
				onClickDelete={onClickDelete}
				isDeletionAllowed={isDeletionAllowed}
			/>
		)
	);
};

export default memo(Row);
