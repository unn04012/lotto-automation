import * as Joi from 'joi';

export const playwrightValidationSchema = Joi.object({
  HEADLESS: Joi.boolean().default(true),
});
