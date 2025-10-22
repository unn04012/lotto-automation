import z from 'zod';
import { LottoTypeEnum } from '../repository/user-lotto.repository.interface';

export const getUserLottoRequestDto = z.object({
  type: z.nativeEnum(LottoTypeEnum),
  round: z.string().optional().describe('If not provided, the latest round will be returned'),
});
export type GetUserLottoRequestDto = z.infer<typeof getUserLottoRequestDto>;
