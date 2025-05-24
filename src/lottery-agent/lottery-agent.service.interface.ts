export type LottoResult = {
  round: number;
  winningNumbers: number[];
  bonusNumber: number;
};

export interface ILotteryAgentService {
  /**
   * browser 에이전트를 초기화합니다.
   */
  initialize(): Promise<void>;
  /**
   * 복권 서비스에 로그인합니다.
   *
   * @param credentials 로그인 자격 증명
   */
  login(credentials: { id: string; password: string }): Promise<void>;

  /**
   * 로또 번호를 조회합니다.
   *
   * @param round 조회할 회차 (생략 시 최신 회차)
   * @returns 로또 번호 배열
   */
  getLottoNumber(round?: number): Promise<LottoResult>;

  /**
   * 일반 로또를 구매합니다.
   * @param numbers
   */
  buyLottery(numbers: number[]): Promise<void>;

  /**
   * 로또 자동 번호로 구매합니다.
   * @param numbers
   */
  buyLotteryAutomation(): Promise<void>;

  /**
   * 연금 복권을 구매합니다.
   * @param numbers
   */
  buyAnnuityLottery(numbers: number[]): Promise<void>;
}
