import { Inject, Injectable } from '@nestjs/common';
import { ILotteryAgentService } from 'src/lottery-agent/lottery-agent.service.interface';
import { Symbols } from 'src/symbols';
import { UserService } from 'src/user/user.service';
import { IUserLottoRepository } from './repository/user-lotto.repository.interface';

@Injectable()
export class LottoService {
  private readonly _userId = '1'; // TODO: replace with actual user ID retrieval logic
  constructor(
    @Inject(Symbols.lotteryAgent) private readonly _lotteryAgent: ILotteryAgentService,
    private readonly _userService: UserService,
    @Inject(Symbols.userLottoRepository) private readonly _userLottoRepository: IUserLottoRepository,
  ) {}

  public async buyLotto() {
    await this._lotteryAgent.initialize();

    const userCredentials = await this._userService.getUserCredentials();

    await this._lotteryAgent.login(userCredentials);

    const { purchasedNumbers, round } = await this._lotteryAgent.buyLotteryAutomation();

    await this._userLottoRepository.save({
      userId: this._userId,
      purchasedNumbers,
      purchasedDate: new Date(),
      round,
    });
  }
}
