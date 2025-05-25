import { UserLottoEntity } from '../domain/user-lotto.entity';

export enum PrizeStatusEnum {
  PENDING = 'PENDING',
  WIN = 'WIN',
  FAIL = 'FAIL',
}
export type PrizeStatus = keyof typeof PrizeStatusEnum;

export enum LottoTypeEnum {
  LOTTO = 'LOTTO',
  POWERBALL = 'POWERBALL',
  ANNUITY_LOTTO = 'ANNUITY_LOTTO',
}
export type LottoType = keyof typeof LottoTypeEnum;

export type CreateUserLottoDto = {
  userId: string;
  purchasedNumbers: number[];
  round: number;
  purchasedDate: Date;
  lottoType: LottoType;
};

export interface IUserLottoRepository {
  findByPurchaseId(purchaseId: string): Promise<UserLottoEntity | null>;

  getUserLottoById(userId: string, round: number, type: LottoType): Promise<UserLottoEntity[]>;

  getUserLottoByRound(round: number): Promise<UserLottoEntity | null>;

  /**
   * create or update user lotto entity
   * @param userLotto
   */
  save(entity: UserLottoEntity): Promise<UserLottoEntity>;
}
