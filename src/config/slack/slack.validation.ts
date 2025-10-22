import * as Joi from 'joi';

export const slackValidationSchema = Joi.object({
  SLACK_WEBHOOK_URL: Joi.string().uri().required(),
});
