import { Test, TestingModule } from '@nestjs/testing';
import { LottoService } from '../lotto.service';

import { LotteryAgentMock } from 'src/lottery-agent/__test__/lottery-agent-mock';
import { Symbols } from '../../symbols';
import { UserService } from 'src/user/user.service';
import { UserLottoRepositoryDynamoDB } from '../repository/user-lotto-repository-dynamoDB';
import { LottoConfigModule } from 'src/config/lotto/lotto-config.module';
import { DynamoDBConfigModule } from 'src/config/dynamodb/dynamodb-config.module';
import { IUserLottoRepository } from '../repository/user-lotto.repository.interface';

describe('LottoService', () => {
  let lottoService: LottoService;
  let lotteryAgentMock: LotteryAgentMock;
  let userLottoRepository: IUserLottoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LottoConfigModule, DynamoDBConfigModule],
      providers: [
        LottoService,
        UserService,
        {
          provide: Symbols.lotteryAgent,
          useClass: LotteryAgentMock,
        },
        {
          provide: Symbols.userLottoRepository,
          useClass: UserLottoRepositoryDynamoDB,
        },
      ],
    }).compile();

    lottoService = module.get<LottoService>(LottoService);
    lotteryAgentMock = module.get<LotteryAgentMock>(Symbols.lotteryAgent);
    userLottoRepository = module.get<IUserLottoRepository>(Symbols.userLottoRepository);
  });

  test('save lotto entity', async () => {
    jest.spyOn(lotteryAgentMock, 'buyLotteryAutomation').mockResolvedValue({
      purchasedNumbers: [1, 2, 3, 4, 5, 6],
      round: 12345,
    });
    await lottoService.buyLotto();

    const userLotto = await lottoService.getUserLotto('LOTTO', '12345');

    expect(userLotto[0].userId).toBe('1');
    expect(userLotto[0].purchasedNumbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(userLotto[0].round).toBe(12345);
  });

  test('win lotto entity', async () => {
    jest.spyOn(lotteryAgentMock, 'buyLotteryAutomation').mockResolvedValue({
      purchasedNumbers: [1, 2, 3, 4, 5, 6],
      round: 12345,
    });
    const purchasedUserLotto = await lottoService.buyLotto();

    const userLotto = await userLottoRepository.findByPurchaseId(purchasedUserLotto.purchaseId);

    if (!userLotto) {
      throw new Error('User lotto not found');
    }

    userLotto.setLottoResult([1, 2, 3, 4, 5, 6], 1);
    console.log(123124, userLotto);
    userLottoRepository.save(userLotto);

    const updatedUserLotto = await userLottoRepository.findByPurchaseId(purchasedUserLotto.purchaseId);
    if (!updatedUserLotto) {
      throw new Error('User lotto not found');
    }
    console.log(updatedUserLotto.getUserLotto());
    expect(updatedUserLotto.prizeStatus).toBe('WIN');
    expect(updatedUserLotto.winningNumbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(updatedUserLotto.bonusNumber).toBe(1);
    expect(updatedUserLotto.rank).toBe(1);
  });
});
