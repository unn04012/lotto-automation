import { z } from 'zod';

export const createUserLottoRequestDto = z.object({
  purchasedNumbers: z.array(z.number().min(1).max(45)).length(6).describe('구입한 로또 번호들 (1~45 사이의 숫자, 중복 불가)'),
  round: z.number().min(1).describe('로또 회차'),
});

export type CreateUserLottoRequestDto = z.infer<typeof createUserLottoRequestDto>;
