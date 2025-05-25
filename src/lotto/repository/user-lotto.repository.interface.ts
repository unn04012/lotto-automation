import { UserLottoEntity } from '../domain/user-lotto.entity';

export enum PrizeStatusEnum {
  PENDING = 'PENDING',
  WIN = 'WIN',
  FAIL = 'FAIL',
}
export type PrizeStatus = keyof typeof PrizeStatusEnum;

export type CreateUserLottoDto = {
  userId: string;
  purchasedNumbers: number[];
  round: number;
  purchasedDate: Date;
};

export interface IUserLottoRepository {
  getUserLottoById(userId: string, round: number): Promise<UserLottoEntity | null>;

  getUserLottoByRound(round: number): Promise<UserLottoEntity | null>;

  /**
   * create or update user lotto entity
   * @param userLotto
   */
  save(dto: CreateUserLottoDto): Promise<UserLottoEntity>;
}
