import { Test, TestingModule } from '@nestjs/testing';
import { LottoService } from '../lotto.service';

import { LotteryAgentMock } from 'src/lottery-agent/__test__/lottery-agent-mock';
import { Symbols } from '../../symbols';
import { UserService } from 'src/user/user.service';
import { UserLottoRepositoryDynamoDB } from '../repository/user-lotto-repository-dynamoDB';
import { LottoConfigModule } from 'src/config/lotto/lotto-config.module';
import { DynamoDBConfigModule } from 'src/config/dynamodb/dynamodb-config.module';

describe('LottoService', () => {
  let lottoService: LottoService;
  let lotteryAgentMock: LotteryAgentMock;

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
  });

  test('save lotto entity', async () => {
    jest.spyOn(lotteryAgentMock, 'buyLotteryAutomation').mockResolvedValue({
      purchasedNumbers: [1, 2, 3, 4, 5, 6],
      round: 12345,
    });
    await lottoService.buyLotto();

    const userLotto = await lottoService.getUserLotto(12345);

    expect(userLotto.userId).toBe('1');
    expect(userLotto.purchasedNumbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(userLotto.round).toBe(12345);
  });
});
