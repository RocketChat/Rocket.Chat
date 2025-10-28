const LoadingIndicator = ({ variation }: { variation?: 'medium' | 'large' }) => {
	return (
		<div className='loading__animation'>
			<div className={['loading__animation__bounce', variation && `loading__animation__bounce--${variation}`].filter(Boolean).join(' ')} />
			<div className={['loading__animation__bounce', variation && `loading__animation__bounce--${variation}`].filter(Boolean).join(' ')} />
			<div className={['loading__animation__bounce', variation && `loading__animation__bounce--${variation}`].filter(Boolean).join(' ')} />
		</div>
	);
};

export default LoadingIndicator;
