import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { BackgroundLayer, LayoutLogo } from '@rocket.chat/layout';
import { useEffect, useState } from 'react';

export type LoaderPageProps = {
	title: string;
	subtitles: string[];
	isReady: boolean;
	loadingSeconds?: number;
};

const LoaderPage = ({ title, subtitles, isReady = false, loadingSeconds = 90 }: LoaderPageProps) => {
	const timeFraction = 100 / subtitles.length;

	const [percentage, setPercentage] = useState(() => (isReady ? 100 : 0));

	useEffect(() => {
		if (isReady) {
			setPercentage(100);
			return;
		}

		const interval = (loadingSeconds * 1000) / 100;
		const timer = setInterval(() => {
			setPercentage((prev) => (prev === 99 ? 99 : prev + 1));
		}, interval);

		return () => {
			clearInterval(timer);
		};
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [isReady]);

	const subtitleIndex = Math.floor(percentage / timeFraction);

	return (
		<BackgroundLayer>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='center'
				textAlign='center'
				width='100%'
				maxWidth={768}
				paddingBlockStart={32}
				paddingBlockEnd={64}
				paddingInline={16}
				gap={32}
			>
				<LayoutLogo />

				<Box fontScale='hero'>{title}</Box>

				<Box fontScale='p1b'>{subtitles[subtitleIndex]}</Box>

				<ProgressBar percentage={percentage} />
			</Box>
		</BackgroundLayer>
	);
};

export default LoaderPage;
