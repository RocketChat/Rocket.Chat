import * as uikit from '@rocket.chat/ui-kit';
import { useCallback, useState } from 'preact/compat';

import Block from '../Block';
import { cx, safeUrl } from './helpers';

// Same rule as the Fuselage renderer: only absolute https pages are framed.
export const isEmbeddable = (url: string) => {
	try {
		return new URL(url).protocol === 'https:' && uikit.isSafeUrl(url);
	} catch {
		return false;
	}
};

export const VideoBlock = ({
	appId,
	blockId,
	video_url: videoUrl,
	thumbnail_url: thumbnailUrl,
	alt_text: altText,
	title,
	title_url: titleUrl,
	description,
	author_name: authorName,
	provider_name: providerName,
}: uikit.VideoBlock) => {
	const [playing, setPlaying] = useState(false);
	const play = useCallback(() => setPlaying(true), []);
	const titleHref = safeUrl(titleUrl);

	return (
		<Block appId={appId} blockId={blockId}>
			<div className={cx('uikit-video')}>
				<div className={cx('uikit-video__title')}>
					{titleHref ? (
						<a href={titleHref} target='_blank' rel='noopener noreferrer'>
							{title.text}
						</a>
					) : (
						title.text
					)}
				</div>
				{description && <div className={cx('uikit-video__description')}>{description.text}</div>}
				{(authorName || providerName) && (
					<div className={cx('uikit-video__meta')}>{[authorName, providerName].filter(Boolean).join(' · ')}</div>
				)}
				{playing && isEmbeddable(videoUrl) ? (
					<iframe
						className={cx('uikit-video__frame')}
						src={videoUrl}
						title={altText}
						sandbox='allow-scripts allow-same-origin allow-presentation'
						allowFullScreen
					/>
				) : (
					<button type='button' className={cx('uikit-video__thumbnail')} onClick={play} aria-label={altText}>
						<img src={safeUrl(thumbnailUrl)} alt={altText} />
					</button>
				)}
			</div>
		</Block>
	);
};
