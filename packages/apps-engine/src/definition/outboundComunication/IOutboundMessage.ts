export interface IOutboundMessage {
    to: string;
    type: 'template';
    templateProviderPhoneNumber: string;
    template: {
        name: string;
        language: {
            code: string;
            policy?: 'deterministic' | 'fallback'; // optional, only in some versions
        };
        // Components is optional as some templates dont use any customizable string, they're just strings and can be sent with just the template name
        components?: TemplateComponent[];
        namespace?: string; // optional
    };
}

type TemplateComponent = {
    type: 'header' | 'body' | 'footer' | 'button';
    parameters: TemplateParameter[];
};

type TemplateParameter =
    | {
          type: 'text';
          text: string;
      }
    | {
          type: 'currency';
          currency: {
              fallback_value: string;
              code: string;
              amount_1000: number;
          };
      }
    | {
          type: 'date_time';
          date_time: {
              fallback_value: string;
              timestamp?: number;
              day_of_week?: number;
              day_of_month?: number;
              year?: number;
              month?: number;
              hour?: number;
              minute?: number;
          };
      }
    | {
          type: 'media';
          link: string;
      };
