import '../../../apps/meteor/app/theme/client/main.css';
import 'highlight.js/styles/github.css';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
	(Story) => (
		<div className="rc-old">
			<style>{`
				body {
					background-color: white;
				}
			`}</style>
			<Story />
		</div>
	)
];
