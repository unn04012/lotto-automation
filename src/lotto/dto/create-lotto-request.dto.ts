import { z } from 'zod';

export const createLottoRequestDto = z.object({
  purchasedNumbers: z.array(z.number().min(1).max(45)).length(6).describe('구입한 로또 번호들 (1~45 사이의 숫자, 중복 불가)'),
});

export type CreateLottoRequestDto = z.infer<typeof createLottoRequestDto>;
