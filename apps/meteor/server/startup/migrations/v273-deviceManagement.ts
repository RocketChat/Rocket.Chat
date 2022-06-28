import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 273,
	async up() {
		const style = `html, body, .body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Meiryo UI',Arial,sans-serif; }

    body, .body {
      width: 100%;
      height: 100%;
    }
  
    a {
      color: #1D74F5;
      font-weight: bold;
      text-decoration: none;
      line-height: 1.8;
      padding-left: 2px;
      padding-right: 2px;
    }
    p {
      margin: 1rem 0;
    }
    .btn {
      text-decoration: none;
      color: #FFF;
      background-color: #1D74F5;
      padding: 12px 18px;
      font-weight: 500;
      font-size: 14px;
      margin-top: 8px;
      text-align: center;
      cursor: pointer;
      display: inline-block;
      border-radius: 2px;
    }
  
    ol, ul, div {
      list-style-position: inside;
      padding: 16px 0 ;
    }
    li {
      padding: 8px 0;
      font-weight: 600;
    }
    .wrap {
      width: 100%;
      clear: both;
    }
  
    h1,h2,h3,h4,h5,h6 {
      line-height: 1.1; margin:0 0 16px 0; color: #000;
    }
  
    h1 { font-weight: 100; font-size: 44px;}
    h2 { font-weight: 600; font-size: 30px; color: #2F343D;}
    h3 { font-weight: 100; font-size: 27px;}
    h4 { font-weight: 500; font-size: 14px; color: #2F343D;}
    h5 { font-weight: 500; font-size: 13px; line-height: 1.6; color: #2F343D}
    h6 { font-weight: 500; font-size: 10px; color: #6c727A; line-height: 1.7;}
  
    .container {
      display: block;
      max-width: 640px;
      margin: 0 auto; /* makes it centered */
      clear: both;
      border-radius: 2px;
    }
  
    .content {
      padding: 36px;
    }
  
    .header-content {
      padding-top: 36px;
      padding-bottom: 36px;
      padding-left: 36px;
      padding-right: 36px;
      max-width: 640px;
      margin: 0 auto;
      display: block;
    }
  
    .lead {
      margin-bottom: 32px;
      color: #2f343d;
      line-height: 22px;
      font-size: 14px;
    }
  
    .advice {
      height: 20px;
      color: #9EA2A8;
      font-size: 12px;
      font-weight: normal;
      margin-bottom: 0;
    }
    .social {
      font-size: 12px
    }
    .rc-color {
      color: #F5455C;
    }`;
		await Settings.updateOne(
			{
				_id: 'email_style',
			},
			{
				$set: {
					packageValue: style,
				},
			},
		);
	},
});
