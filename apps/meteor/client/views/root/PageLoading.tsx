const PageLoading = () => (
	<div className='page-loading' role='alert' aria-busy='true' aria-live='polite' aria-label='loading'>
		<div className='loading__animation'>
			<div className='loading__animation__bounce' />
			<div className='loading__animation__bounce' />
			<div className='loading__animation__bounce' />
		</div>
	</div>
);

export default PageLoading;
