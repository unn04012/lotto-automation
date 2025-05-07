export abstract class LotteryAgentBaseService {
  /**
   * 에이전트를 초기화합니다.
   */
  abstract initialize(): Promise<void>;

  /**
   * 복권 서비스에 로그인합니다.
   *
   * @param credentials 로그인 자격 증명
   */
  abstract login(credentials: { id: string; password: string }): Promise<void>;

  /**
   * 로또 번호를 조회합니다.
   *
   * @param round 조회할 회차 (생략 시 최신 회차)
   * @returns 로또 번호 배열
   */
  abstract getLottoNumber(round?: number): Promise<number[]>;
}
