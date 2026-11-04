import * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { useCallback, useState } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import Block, { usePerformAction } from '../Block';
import Mrkdwn from '../Mrkdwn';
import styles from './styles.scss';

type Parser = uikit.SurfaceRenderer<ComponentChild>;

const cx = (name: string, modifiers = {}) => createClassName(styles, name, modifiers);

const safeUrl = (url?: string) => (url && uikit.isSafeUrl(url) ? url : undefined);

export const HeaderBlock = ({ appId, blockId, text }: uikit.HeaderBlock) => (
	<Block appId={appId} blockId={blockId}>
		<h3 className={cx('uikit-header')}>{text.text}</h3>
	</Block>
);

export const MarkdownBlock = ({ appId, blockId, text }: uikit.MarkdownBlock) => (
	<Block appId={appId} blockId={blockId}>
		<div className={cx('uikit-markdown')}>
			<Mrkdwn text={text} />
		</div>
	</Block>
);

export const CalloutBlock = ({
	appId,
	blockId,
	title,
	text,
	variant = 'info',
	accessory,
	parser,
}: uikit.CalloutBlock & { parser: Parser }) => (
	<Block appId={appId} blockId={blockId}>
		<div className={cx('uikit-callout', { variant })} role='note'>
			<div className={cx('uikit-callout__content')}>
				{title && <div className={cx('uikit-callout__title')}>{parser.renderTextObject(title, 0)}</div>}
				{parser.renderTextObject(text, 1)}
			</div>
			{accessory && <div className={cx('uikit-callout__accessory')}>{parser.renderSectionAccessoryBlockElement(accessory, 0)}</div>}
		</div>
	</Block>
);

export const TableBlock = ({ appId, blockId, rows, column_settings: columnSettings, parser }: uikit.TableBlock & { parser: Parser }) => {
	const [header = [], ...body] = rows;

	const renderCell = (cell: uikit.TableCell, key: number) => (cell.type === 'raw_text' ? cell.text : parser.renderTextObject(cell, key));
	const cellStyle = (column: number) => ({ textAlign: columnSettings?.[column]?.align });

	return (
		<Block appId={appId} blockId={blockId}>
			<div className={cx('uikit-table')}>
				<table>
					<thead>
						<tr>
							{header.map((cell, column) => (
								<th key={column} style={cellStyle(column)}>
									{renderCell(cell, column)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{body.map((row, r) => (
							<tr key={r}>
								{row.map((cell, column) => (
									<td key={column} style={cellStyle(column)}>
										{renderCell(cell, column)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Block>
	);
};

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

export const PreviewBlock = (block: uikit.PreviewBlock & { parser: Parser }) => {
	const { appId, blockId, title, description, footer, parser } = block;
	const image = 'thumb' in block && block.thumb ? block.thumb : 'preview' in block ? block.preview : undefined;
	const href = 'externalUrl' in block ? safeUrl(block.externalUrl) : undefined;

	const body = (
		<>
			<div className={cx('uikit-preview__title')}>{title.map((t, i) => parser.renderTextObject(t, i))}</div>
			<div className={cx('uikit-preview__description')}>{description.map((t, i) => parser.renderTextObject(t, i))}</div>
		</>
	);

	return (
		<Block appId={appId} blockId={blockId}>
			<div className={cx('uikit-preview')}>
				{image && safeUrl(image.url) && <img className={cx('uikit-preview__image')} src={image.url} alt='' />}
				<div className={cx('uikit-preview__content')}>
					{href ? (
						<a href={href} target='_blank' rel='noopener noreferrer'>
							{body}
						</a>
					) : (
						body
					)}
					{footer && parser.renderContextBlockElement(footer as never, 0)}
				</div>
			</div>
		</Block>
	);
};

type ContextActionButtonProps = { actionId: string; label?: string; glyph: string; value?: string; url?: string };

const ContextActionButton = ({ actionId, label, glyph, value, url }: ContextActionButtonProps) => {
	const [performAction, performing] = usePerformAction(actionId);

	const handleClick = useCallback(async () => {
		const href = safeUrl(url);
		if (href) {
			window.open(href, '_blank', 'noopener,noreferrer');
			return;
		}
		await performAction({ value });
	}, [performAction, url, value]);

	return (
		<button
			type='button'
			className={cx('uikit-context-action')}
			disabled={performing}
			aria-label={label}
			title={label}
			onClick={handleClick}
		>
			{glyph}
		</button>
	);
};

export const ContextActionsBlock = ({ appId, blockId, elements }: uikit.ContextActionsBlock) => (
	<Block appId={appId} blockId={blockId}>
		<div className={cx('uikit-context-actions')}>
			{elements.map((element, key) =>
				element.type === 'feedback_buttons' ? (
					<>
						<ContextActionButton
							key={`${key}-positive`}
							actionId={element.actionId}
							glyph={'\u{1F44D}'}
							label={element.positive_button.accessibility_label ?? element.positive_button.text.text}
							value={element.positive_button.value}
						/>
						<ContextActionButton
							key={`${key}-negative`}
							actionId={element.actionId}
							glyph={'\u{1F44E}'}
							label={element.negative_button.accessibility_label ?? element.negative_button.text.text}
							value={element.negative_button.value}
						/>
					</>
				) : (
					<ContextActionButton
						key={key}
						actionId={element.actionId}
						glyph={element.label ?? element.icon.icon}
						label={element.label ?? element.icon.icon}
						value={element.value}
						url={element.url}
					/>
				),
			)}
		</div>
	</Block>
);
