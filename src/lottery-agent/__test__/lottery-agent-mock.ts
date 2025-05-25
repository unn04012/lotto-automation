import { ILotteryAgentService, LottoResult } from '../lottery-agent.service.interface';

export class LotteryAgentMock implements ILotteryAgentService {
  public async initialize(): Promise<void> {}

  public async login(credentials: { id: string; password: string }): Promise<void> {}

  getLottoNumber(round?: number): Promise<LottoResult> {
    throw new Error('Method not implemented.');
  }
  buyLottery(numbers: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async buyLotteryAutomation(): Promise<{ purchasedNumbers: number[]; round: number }> {
    return {
      purchasedNumbers: [1, 2, 3, 4, 5, 6],
      round: 12345,
    };
  }
  buyAnnuityLottery(numbers: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
