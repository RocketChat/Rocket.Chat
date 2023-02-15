import { Box, Skeleton, Tile } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

type IComposerBoxPopupPreviewProps = {
	title: string;
};

const ComposerBoxPopupPreview = ({ title, ...props }: IComposerBoxPopupPreviewProps) => {
	const id = useUniqueId();

	const items = useQuery<{
		_id: string;
	}>(['items'], async () => []);
	return (
		<div className='message-popup-position'>
			<Box className='message-popup-position' position='relative'>
				<Tile className='message-popup' padding={0} role='menu' mbe='x2' maxHeight='20rem' aria-labelledby={id}>
					<Box bg='tint' pi='x16' pb='x8' id={id}>
						{title}
					</Box>
					{items.isLoading && <Skeleton />}

					{items.isSuccess && (
						<div className='message-popup-items preview-items'>
							{items.data.map((item) => {
								return (
									<div className='popup-item' id={item._id} key={item._id}>
										{/* //     {{ #if isType 'image' type }}
                                //     <img src="{{value}}" alt="{{value}}">
                                //         {{/if}}

                                //         {{ #if isType 'audio' type }}
                                //         <audio controls>
                                //             <source src="{{value}}">
                                //                 Your browser does not support the audio element.
                                //         </audio>
                                //         {{/if}}

                                //         {{ #if isType 'video' type }}
                                //         <video controls class="inline-video">
                                //             <source src="{{value}}">
                                //                 Your browser does not support the video element.
                                //         </video>
                                //         {{/if}}

                                //         {{ #if isType 'text' type }}
                                //         <h4>{{ value }}</h4> <!-- Not sure what to do here -->
                                //         {{/if}}

                                //         {{ #if isType 'other' type }}
                                //         <code>{{ value }}</code>
                                //         {{/if}} */}
									</div>
								);
							})}
						</div>
					)}
				</Tile>
			</Box>
		</div>
	);
};

export default ComposerBoxPopupPreview;
