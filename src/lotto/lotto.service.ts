import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILotteryAgentService } from 'src/lottery-agent/lottery-agent.service.interface';
import { Symbols } from 'src/symbols';
import { UserService } from 'src/user/user.service';
import { IUserLottoRepository, LottoType } from './repository/user-lotto.repository.interface';
import { UserLottoEntity } from './domain/user-lotto.entity';
import { NotificationSlackService } from 'src/notification/notificaiton-slack.service';

@Injectable()
export class LottoService {
  private readonly _userId = '1'; // TODO: replace with actual user ID retrieval logic
  private readonly _logger = new Logger(LottoService.name);
  constructor(
    @Inject(Symbols.lotteryAgent) private readonly _lotteryAgent: ILotteryAgentService,
    private readonly _userService: UserService,
    @Inject(Symbols.userLottoRepository) private readonly _userLottoRepository: IUserLottoRepository,
    private readonly notificationSlackService: NotificationSlackService,
  ) {}

  public async buyLottoManual(numbers: number[]) {
    await this._lotteryAgent.initialize();

    const userCredentials = await this._userService.getUserCredentials();

    await this._lotteryAgent.login(userCredentials);

    const { round } = await this._lotteryAgent.buyLottery(numbers);

    const purchasedDate = new Date();

    const userLottoEntity = UserLottoEntity.create({
      userId: this._userId,
      purchasedNumbers: numbers,
      purchasedDate,
      round,
      lottoType: 'LOTTO',
    });

    const userLotto = await this._userLottoRepository.save(userLottoEntity);

    await this.notificationSlackService.sendPurchaseCompletionNotification({
      purchasedDate,
      purchasedNumbers: numbers,
      game: '6/45',
    });

    return userLotto.getUserLotto();
  }

  public async buyLotto() {
    // await this._lotteryAgent.initialize();

    const userCredentials = await this._userService.getUserCredentials();

    await this._lotteryAgent.login(userCredentials);

    const { purchasedNumbers, round } = await this._lotteryAgent.buyLotteryAutomation();

    const purchasedDate = new Date();

    const userLottoEntity = UserLottoEntity.create({
      userId: this._userId,
      purchasedNumbers,
      purchasedDate,
      round,
      lottoType: 'LOTTO',
    });

    const userLotto = await this._userLottoRepository.save(userLottoEntity);

    await this.notificationSlackService.sendPurchaseCompletionNotification({
      purchasedDate,
      purchasedNumbers,
      game: '6/45',
    });

    return userLotto.getUserLotto();
  }

  /**
   * 구입한 로또를 저장합니다.
   */
  public async createLotto(purchasedNumbers: number[], round: number) {
    const purchasedDate = new Date();

    const userLottoEntity = UserLottoEntity.create({
      userId: this._userId,
      purchasedNumbers,
      purchasedDate,
      round,
      lottoType: 'LOTTO',
    });

    const userLotto = await this._userLottoRepository.save(userLottoEntity);

    return userLotto.getUserLotto();
  }

  public async getUserLotto(type: LottoType, round?: string) {
    const roundNumber = round ? Number(round) : (await this._lotteryAgent.getLottoNumber()).round;

    this._logger.log(`Fetching user lotto for type: ${type}, round: ${roundNumber}`);

    const users = await this._userLottoRepository.getUserLottoById(this._userId, roundNumber, type);

    return users.map((user) => user.getUserLotto());
  }

  public async updateUserLottoRank(type: LottoType, roundNumber?: number) {
    const { round, bonusNumber, winningNumbers } = await this._lotteryAgent.getLottoNumber(roundNumber);

    const users = await this._userLottoRepository.getUserLottoById(this._userId, round, type);

    for (const user of users) {
      user.setLottoResult(winningNumbers, bonusNumber);

      await this.notificationSlackService.sendLotteryResultNotification({
        myNumbers: user.purchasedNumbers,
        winningNumbers,
        rank: user.rank || 0,
      });

      await this._userLottoRepository.save(user);
    }
  }
}
