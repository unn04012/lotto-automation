import { DynamoDBConfigService } from 'src/config/dynamodb/dynamodb-config.service';
import { UserLottoEntity } from '../domain/user-lotto.entity';
import { CreateUserLottoDto, IUserLottoRepository } from './user-lotto.repository.interface';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserLottoRepositoryDynamoDB implements IUserLottoRepository {
  private readonly _client: DynamoDBClient;
  constructor(private readonly _dynamoDBConfig: DynamoDBConfigService) {
    this._client = this._dynamoDBConfig.client;
  }

  public async getUserLottoById(userId: string): Promise<UserLottoEntity | null> {
    throw new Error('Method not implemented.');
  }
  public async getUserLottoByRound(round: number): Promise<UserLottoEntity | null> {
    throw new Error('Method not implemented.');
  }

  public async save({ userId, purchasedDate, purchasedNumbers, round }: CreateUserLottoDto): Promise<UserLottoEntity> {
    const userLotto = UserLottoEntity.create({
      userId,
      purchasedNumbers,
      purchasedDate,
      round,
    });

    await this._putItemCommand(userLotto);

    return userLotto;
  }

  private async _putItemCommand(userLotto: UserLottoEntity) {
    const param: PutItemCommandInput = {
      TableName: 'UserLotto',
      Item: {
        userId: {
          S: userLotto.userId,
        },
        purchasedNumbers: {
          L: userLotto.purchasedNumbers.map((num) => ({ N: num.toString() })),
        },
        round: {
          N: userLotto.round.toString(),
        },
        purchasedDate: {
          S: userLotto.purchasedDate.toISOString(),
        },
        prizeStatus: {
          S: userLotto.prizeStatus, // Assuming prizeStatus is a string
        },
        winningNumbers: {
          L: userLotto.winningNumbers ? userLotto.winningNumbers.map((num) => ({ N: num.toString() })) : [],
        },
        bonusNumber: {
          N: userLotto.bonusNumber ? userLotto.bonusNumber.toString() : '0', // Assuming bonusNumber is a number
        },
        rank: {
          N: userLotto.rank ? userLotto.rank.toString() : '0', // Assuming rank is a number
        },
      },
    };
    await this._client.send(new PutItemCommand(param));
  }
}
