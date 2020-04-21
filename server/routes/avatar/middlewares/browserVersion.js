
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import parser from 'ua-parser-js';

Meteor.startup(function() {
	return WebApp.connectHandlers.use(Meteor.bindEnvironment(function(req, res, next) {
		if (req.cookies.bypass_browser_version === '1') {
			return next();
		}

		const result = parser(req.headers['user-agent']);
		if (!result || result.browser.name !== 'IE' || parseInt(result.browser.version) >= 11) {
			return next();
		}

		res.setHeader('content-type', 'text/html; charset=utf-8');

		res.write(`
			<style>@charset "UTF-8";
				body {
					margin: 0;
					font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Meiryo UI',Arial,sans-serif;
				}

				.rcx-box--text-style-headline {
					letter-spacing: 0rem;
					letter-spacing: var(--rcx-text-styles-h1-letter-spacing, 0rem);
					font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Helvetica Neue, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Meiryo UI, Arial, sans-serif;
					font-family: var(--rcx-text-styles-h1-font-family, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Helvetica Neue, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Meiryo UI, Arial, sans-serif);
					font-size: 1.375rem;
					font-size: var(--rcx-text-styles-h1-font-size, 1.375rem);
					font-weight: 400;
					font-weight: var(--rcx-text-styles-h1-font-weight, 400);
					line-height: 2rem;
					line-height: var(--rcx-text-styles-h1-line-height, 2rem);
				}

				.not-supported-browser {
					width: 100%;
					min-height: 100vh;

					text-align: center;

					background-color: var(--rc-color-primary);
					background-image: url('/images/404.svg');
					background-repeat: no-repeat;
					background-position: center;
					background-size: cover;

					display: flex;
					justify-content: center;
					align-items: center;

					&__404 {
						font-size: 4em;
						font-weight: bold;
					}
				}

				.not-supported-browser__text {
					font-size: 4em;
					font-weight: bold;
				}

				.rcx-box--text-color-alternative {
					color: #ffffff;
					color: var(--rcx-text-colors-alternative, #ffffff);
				}

				.rcx-box, .rcx-box::before, .rcx-box::after {
					box-sizing: border-box;
					margin: 0;
					padding: 0;
					transition: all 230ms;
					transition: all var(--rcx-transitions-short-duration, 230ms);
					border-width: 0;
					border-style: solid;
					border-color: currentColor;
					outline: none;
					-webkit-font-smoothing: antialiased;
					-moz-osx-font-smoothing: grayscale;
					font-variant-numeric: tabular-nums;
				}

				.rcx-button {
					display: inline-block;
					text-align: center;
					vertical-align: middle;
					white-space: nowrap;
					text-decoration: none;
					cursor: pointer;
					outline: 0;
					letter-spacing: 0rem;
					letter-spacing: var(--rcx-text-styles-p2-letter-spacing, 0rem);
					font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Helvetica Neue, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Meiryo UI, Arial, sans-serif;
					font-family: var(--rcx-text-styles-p2-font-family, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Helvetica Neue, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Meiryo UI, Arial, sans-serif);
					font-size: 0.875rem;
					font-size: var(--rcx-text-styles-p2-font-size, 0.875rem);
					font-weight: 500;
					font-weight: var(--rcx-text-styles-p2-font-weight, 500);
					line-height: 1.25rem;
					line-height: var(--rcx-text-styles-p2-line-height, 1.25rem);
					overflow: hidden;
					text-overflow: ellipsis;
					padding: calc((2.5rem - 1.25rem) / 2 - 0.125rem) calc(1rem - 0.125rem);
					padding: calc((var(--rcx-sizes-x40, 2.5rem) - var(--rcx-text-styles-p1-line-height, 1.25rem)) / 2 - var(--rcx-borders-width-x2, 0.125rem)) calc(var(--rcx-spaces-x16, 1rem) - var(--rcx-borders-width-x2, 0.125rem));
					padding-top: calc((2.5rem - 1.25rem) / 2 - 0.125rem);
					padding-bottom: calc((2.5rem - 1.25rem) / 2 - 0.125rem);
					padding-block: calc((2.5rem - 1.25rem) / 2 - 0.125rem);
					padding-top: calc((var(--rcx-sizes-x40, 2.5rem) - var(--rcx-text-styles-p1-line-height, 1.25rem)) / 2 - var(--rcx-borders-width-x2, 0.125rem));
					padding-bottom: calc((var(--rcx-sizes-x40, 2.5rem) - var(--rcx-text-styles-p1-line-height, 1.25rem)) / 2 - var(--rcx-borders-width-x2, 0.125rem));
					padding-block: calc((var(--rcx-sizes-x40, 2.5rem) - var(--rcx-text-styles-p1-line-height, 1.25rem)) / 2 - var(--rcx-borders-width-x2, 0.125rem));
					padding-left: calc(1rem - 0.125rem);
					padding-right: calc(1rem - 0.125rem);
					padding-inline: calc(1rem - 0.125rem);
					padding-left: calc(var(--rcx-spaces-x16, 1rem) - var(--rcx-borders-width-x2, 0.125rem));
					padding-right: calc(var(--rcx-spaces-x16, 1rem) - var(--rcx-borders-width-x2, 0.125rem));
					padding-inline: calc(var(--rcx-spaces-x16, 1rem) - var(--rcx-borders-width-x2, 0.125rem));
				}

				.rcx-button--primary {
					color: #ffffff;
					color: var(--rcx-button-colors-primary-color, #ffffff);
					border-width: 0.125rem;
					border-width: var(--rcx-borders-width-x2, 0.125rem);
					border-style: solid;
					border-color: #1d74f5;
					border-color: var(--rcx-button-colors-primary-border-color, #1d74f5);
					border-radius: 0.125rem;
					border-radius: var(--rcx-borders-radius-x2, 0.125rem);
					background-color: #1d74f5;
					background-color: var(--rcx-button-colors-primary-background-color, #1d74f5);
					-webkit-appearance: none;
					-moz-appearance: none;
					appearance: none;
				}

				.rcx-box--text-color-primary {
					color: #1d74f5;
					color: var(--rcx-text-colors-primary, #1d74f5);
				}
				.rcx-box.rcx-\@s6mi60{margin:0.75rem !important;}.rcx-box.rcx-\@19aubzx{margin:2rem !important;}.rcx-box.rcx-\@1kgm1vs{-webkit-align-items:center !important;-webkit-box-align:center !important;-ms-flex-align:center !important;align-items:center !important;-webkit-box-pack:center !important;-webkit-justify-content:center !important;-ms-flex-pack:center !important;justify-content:center !important;-webkit-flex-direction:column !important;-ms-flex-direction:column !important;flex-direction:column !important;}.rcx-box.rcx-\@1qvl0ud{display:-webkit-box !important;display:-webkit-flex !important;display:-ms-flexbox !important;display:flex !important;}
			</style>

			<section class="rcx-box not-supported-browser rcx-@1kgm1vs rcx-@1qvl0ud">
				<div class="rcx-box">
					<div class="rcx-box rcx-box--text-color-alternative not-supported-browser__text rcx-@s6mi60">Browser Not Supported</div>
					<a class="rcx-box rcx-button rcx-button--primary" href="https://rocket.chat/docs/getting-support/#supported-browser-versions" target="_blank">Check the Documentation</a>
					<a class="rcx-box rcx-button rcx-button--primary" href="#" onclick="document.cookie = 'bypass_browser_version=1; path=/'; location.reload(true);">Proceed Anyway</a>
				</div>
			</section>
		`);

		return res.end();
	}));
});
