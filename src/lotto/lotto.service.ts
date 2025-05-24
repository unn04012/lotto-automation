import { Inject, Injectable } from '@nestjs/common';
import { ILotteryAgentService } from 'src/lottery-agent/lottery-agent.service.interface';
import { Symbols } from 'src/symbols';
import { UserService } from 'src/user/user.service';

@Injectable()
export class LottoService {
  constructor(
    @Inject(Symbols.lotteryAgent) private readonly _lotteryAgent: ILotteryAgentService,
    private readonly _userService: UserService,
  ) {}

  public async buyLotto() {
    await this._lotteryAgent.initialize();

    const userCredentials = await this._userService.getUserCredentials();

    await this._lotteryAgent.login(userCredentials);

    await this._lotteryAgent.buyLotteryAutomation();

    //TODO  save lotto numbers to database
  }
}
