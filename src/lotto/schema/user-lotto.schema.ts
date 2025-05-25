import { PrizeStatus } from '../repository/user-lotto.repository.interface';

export interface UserLottoSchema {
  userId: string; // PK
  purchasedNumbers: number[];
  purchasedDate: string;
  isWinning?: boolean;
  winningNumbers?: number[];
  bonusNumber?: number;
  round: number; // 로또 회차
  rank?: number;
  prizeStatus: PrizeStatus;
}
