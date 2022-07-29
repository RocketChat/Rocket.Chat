import { Box, Icon, Button } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type FilePickerBreadcrumbsProps = {
	parentFolders: Array<string>;
	handleBreadcrumb: () => void;
};

const FilePickerBreadcrumbs = ({ parentFolders, handleBreadcrumb }: FilePickerBreadcrumbsProps): ReactElement => {
	console.log(parentFolders);
	return (
		<Box display='flex' alignItems='center'>
			<Button ghost small data-index={-1} onClick={handleBreadcrumb}>
				<Icon size='x20' name='home' />
			</Button>
			{parentFolders?.map((parentFolder, index) => (
				<Box display='flex' alignItems='center' key={index}>
					<Icon name='chevron-left' />
					<Box aria-label='{{ parentFolder }}' data-index='{{@index}}'>
						{parentFolder}
					</Box>
				</Box>
			))}
		</Box>

		// <div className="webdav-path-breadcrumb">
		//   <div className="webdav-breadcrumb-item">
		//     <button className="webdav-breadcrumb-folder js-webdav-breadcrumb-folder" aria-label="Home" data-index="-1">
		//       <i className="icon-home"></i>
		//     </button>
		//   </div>
		//   {{#each parentFolder in parentFolders}}
		//     <div className="webdav-breadcrumb-item">
		//       <i className="icon-angle-right"></i>
		//       <button className="webdav-breadcrumb-folder js-webdav-breadcrumb-folder" aria-label="{{ parentFolder }}" data-index="{{@index}}">
		//         {{ parentFolder }}
		//       </button>
		//     </div>
		//   {{/each}}
		// </div>
	);
};

export default FilePickerBreadcrumbs;
