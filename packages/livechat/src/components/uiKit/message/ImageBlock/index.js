import { memo, useEffect, useState, useMemo } from 'preact/compat';

import { createClassName } from '../../../helpers';
import Block from '../Block';
import styles from './styles.scss';

const MAX_SIZE = 360;

const ImageBlock = ({ appId, blockId, title, imageUrl, altText, parser }) => {
	const [{ loading, naturalWidth, naturalHeight }, updateImageState] = useState(() => ({
		loading: true,
		naturalWidth: MAX_SIZE,
		naturalHeight: MAX_SIZE,
	}));

	useEffect(() => {
		const image = new Image();
		let cancelled = false;

		image.onload = () => {
			if (cancelled) {
				return;
			}

			updateImageState({
				loading: false,
				naturalWidth: image.naturalWidth,
				naturalHeight: image.naturalHeight,
			});
		};

		image.src = imageUrl;

		return () => {
			cancelled = true;
		};
	}, [imageUrl]);

	const contentStyle = useMemo(
		() => ({
			maxWidth: Math.min(MAX_SIZE, (naturalWidth / naturalHeight) * MAX_SIZE),
		}),
		[naturalHeight, naturalWidth],
	);

	const wrapperStyle = useMemo(
		() => ({
			paddingBottom: `${(naturalHeight / naturalWidth) * 100}%`,
		}),
		[naturalHeight, naturalWidth],
	);

	const linkStyle = useMemo(
		() => ({
			backgroundImage: `url(${imageUrl})`,
		}),
		[imageUrl],
	);

	return (
		<Block appId={appId} blockId={blockId}>
			<div className={createClassName(styles, 'uikit-image-block')}>
				{title && <h3 className={createClassName(styles, 'uikit-image-block__title')}>{parser.text(title)}</h3>}
				<div className={createClassName(styles, 'uikit-image-block__content', { loading })} style={contentStyle}>
					<div className={createClassName(styles, 'uikit-image-block__wrapper')} style={wrapperStyle}>
						<a
							children={imageUrl}
							className={createClassName(styles, 'uikit-image-block__link')}
							href={imageUrl}
							rel='noopener noreferrer'
							style={linkStyle}
							target='_blank'
							title={altText}
						/>
					</div>
				</div>
			</div>
		</Block>
	);
};

export default memo(ImageBlock);
