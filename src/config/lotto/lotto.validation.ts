import * as Joi from 'joi';

export const lottoValidationSchema = Joi.object({
  LOTTO_ID: Joi.string().required(),
  LOTTO_PASSWORD: Joi.string().required(),
});
