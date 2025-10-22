import * as Joi from 'joi';

export const appValidationSchema = Joi.object({
  API_KEY: Joi.string().required(),
  API_HEADER_KEY: Joi.string().required(),
  HTTP_PORT: Joi.number().default(3000),
  ENVIRONMENT: Joi.string().valid('LOCAL', 'PROD', 'MCP').default('PROD'),
  PLAYWRIGHT_BROWSERS_PATH: Joi.string().optional(),
});
