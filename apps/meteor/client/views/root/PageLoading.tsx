import LoadingIndicator from '../../components/LoadingIndicator';

const PageLoading = () => (
	<div className='page-loading' role='alert' aria-busy='true' aria-live='polite' aria-label='Loading...'>
		<LoadingIndicator />
	</div>
);

export default PageLoading;
