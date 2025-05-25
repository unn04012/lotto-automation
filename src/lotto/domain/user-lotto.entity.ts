import { PrizeStatus, PrizeStatusEnum } from '../repository/user-lotto.repository.interface';

export class UserLottoEntity {
  private readonly _userId: string;
  private readonly _purchasedNumbers: number[];
  private readonly _round: number;
  private readonly _purchasedDate: Date;
  private readonly _prizeStatus: PrizeStatus;
  private readonly _rank?: number;

  private readonly _winningNumbers: number[];
  private readonly _bonusNumber: number;

  get userId() {
    return this._userId;
  }
  get purchasedNumbers() {
    return this._purchasedNumbers;
  }
  get round() {
    return this._round;
  }
  get purchasedDate() {
    return this._purchasedDate;
  }
  get prizeStatus() {
    return this._prizeStatus;
  }
  get winningNumbers() {
    return this._winningNumbers;
  }
  get bonusNumber() {
    return this._bonusNumber;
  }
  get rank() {
    return this._rank;
  }

  private constructor({
    userId,
    round,
    purchasedNumbers,
    winningNumbers,
    bonusNumber,
    status,
  }: {
    userId: string;
    purchasedNumbers: number[];
    round: number;
    purchasedDate: Date;
    status: PrizeStatus;
    winningNumbers?: number[];
    bonusNumber?: number;
  }) {
    this._userId = userId;
    this._purchasedNumbers = purchasedNumbers;
    this._round = round;
    this._prizeStatus = status;

    if (winningNumbers) this._winningNumbers = winningNumbers;
    if (bonusNumber) this._bonusNumber = bonusNumber;
  }

  /**
   * UserLottoEntity 생성자
   * @param userId 사용자 ID
   * @param purchasedNumbers 구매한 번호 배열
   * @param round 로또 회차
   * @param purchasedDate 구매 날짜
   * @param prizeStatus
   * @param winningNumbers 당첨 번호 배열 (선택적)
   * @param bonusNumber 보너스 번호 (선택적)
   * @returns UserLottoEntity 인스턴스
   **/

  public static create({
    userId,
    purchasedDate,
    purchasedNumbers,
    round,
    winningNumbers,
    bonusNumber,
  }: {
    userId: string;
    purchasedNumbers: number[];
    round: number;
    purchasedDate: Date;
    winningNumbers?: number[];
    bonusNumber?: number;
    prizeStatus?: PrizeStatus;
  }): UserLottoEntity {
    const entity = new UserLottoEntity({
      userId,
      purchasedNumbers,
      status: 'PENDING',
      round,
      purchasedDate,
      winningNumbers,
      bonusNumber,
    });

    return entity;
  }
}
