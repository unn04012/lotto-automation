import { LottoType, PrizeStatus } from '../repository/user-lotto.repository.interface';
import { UserLottoSchema } from '../schema/user-lotto.schema';

export class UserLottoEntity {
  private readonly _purchaseId: string;
  private readonly _userId: string;
  private readonly _purchasedNumbers: number[];
  private readonly _round: number;
  private readonly _purchasedDate: Date;
  private readonly _lottoType: LottoType;

  private _prizeStatus: PrizeStatus;
  private _rank?: number;
  private _winningNumbers: number[];
  private _bonusNumber: number;

  get purchaseId() {
    return this._purchaseId;
  }
  get lottoType() {
    return this._lottoType;
  }
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

  set rank(value: number | undefined) {
    this._rank = value;
  }
  set winningNumbers(value: number[] | undefined) {
    if (value) {
      this._winningNumbers = value;
    } else {
      throw new Error('Winning numbers cannot be set to undefined');
    }
  }

  private constructor({
    userId,
    round,
    purchasedNumbers,
    purchasedDate,
    winningNumbers,
    bonusNumber,
    lottoType,
    status,
    purchaseId,
    rank,
  }: {
    userId: string;
    purchasedNumbers: number[];
    round: number;
    purchasedDate: Date;
    status: PrizeStatus;
    winningNumbers?: number[];
    bonusNumber?: number;
    lottoType: LottoType;
    purchaseId: string;
    rank?: number;
  }) {
    this._userId = userId;
    this._purchasedNumbers = purchasedNumbers;
    this._round = round;
    this._prizeStatus = status;
    this._purchasedDate = purchasedDate;
    this._lottoType = lottoType;
    this._purchaseId = purchaseId;

    if (winningNumbers) this._winningNumbers = winningNumbers;
    if (bonusNumber) this._bonusNumber = bonusNumber;
    if (rank) this._rank = rank;
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
    lottoType,
  }: {
    userId: string;
    purchasedNumbers: number[];
    round: number;
    purchasedDate: Date;
    winningNumbers?: number[];
    bonusNumber?: number;
    prizeStatus?: PrizeStatus;
    lottoType: LottoType;
  }): UserLottoEntity {
    const entity = new UserLottoEntity({
      userId,
      purchasedNumbers,
      status: 'PENDING',
      round,
      purchasedDate,
      winningNumbers,
      bonusNumber,
      lottoType,
      purchaseId: crypto.randomUUID(),
    });

    return entity;
  }

  public static fromSchema(schema: UserLottoSchema): UserLottoEntity {
    return new UserLottoEntity({
      userId: schema.userId,
      purchasedNumbers: schema.purchasedNumbers,
      round: schema.round,
      purchasedDate: new Date(schema.purchasedDate),
      status: schema.prizeStatus as PrizeStatus,
      winningNumbers: schema.winningNumbers,
      bonusNumber: schema.bonusNumber,
      lottoType: schema.lottoType,
      purchaseId: schema.purchaseId,
      rank: schema.rank,
    });
  }

  public getUserLotto() {
    return {
      purchaseId: this._purchaseId,
      userId: this._userId,
      purchasedNumbers: this._purchasedNumbers,
      round: this._round,
      prizeStatus: this._prizeStatus,
      winningNumbers: this._winningNumbers,
      bonusNumber: this._bonusNumber,
      rank: this._rank,
    };
  }

  public calculateRank(winningNumbers: number[], bonusNumber: number) {
    const matchedCount = this._purchasedNumbers.filter((num) => winningNumbers.includes(num)).length;
    const hasBonus = this._purchasedNumbers.includes(bonusNumber);

    switch (matchedCount) {
      case 6:
        return 1;
      case 5:
        return hasBonus ? 2 : 3;
      case 4:
        return 4;
      case 3:
        return 5;
      default:
        return undefined; // 당첨되지 않음
    }
  }

  public setLottoResult(winningNumbers: number[], bonusNumber: number) {
    const rank = this.calculateRank(winningNumbers, bonusNumber);

    this._winningNumbers = winningNumbers;
    this._bonusNumber = bonusNumber;

    if (rank) {
      this._prizeStatus = 'WIN';
      this._bonusNumber = bonusNumber;
      this._rank = rank;
    } else {
      this._prizeStatus = 'FAIL';
    }
  }
}
