import { DynamoDBConfigService } from 'src/config/dynamodb/dynamodb-config.service';
import { UserLottoEntity } from '../domain/user-lotto.entity';
import { CreateUserLottoDto, IUserLottoRepository, PrizeStatus } from './user-lotto.repository.interface';
import { AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserLottoRepositoryDynamoDB implements IUserLottoRepository {
  private readonly _client: DynamoDBClient;
  constructor(private readonly _dynamoDBConfig: DynamoDBConfigService) {
    this._client = this._dynamoDBConfig.client;
  }

  public async getUserLottoById(userId: string, round: number): Promise<UserLottoEntity | null> {
    const params: GetItemCommandInput = {
      TableName: 'UserLotto',
      Key: {
        userId: { S: userId },
        round: { N: String(round) }, // Assuming round is not used in the key, or you can adjust this based on your key schema
      },
    };

    const userLotto = await this._client.send(new GetItemCommand(params));

    if (!userLotto.Item) {
      return null; // No item found
    }
    try {
      return this._mapDynamoDBItemToEntity(userLotto.Item);
    } catch (error) {
      console.error('Error getting user lotto by id:', error);
      throw error;
    }
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

  private _mapDynamoDBItemToEntity(item: Record<string, AttributeValue>): UserLottoEntity {
    const purchasedNumbers = item.purchasedNumbers?.L?.map((num) => parseInt(num.N || '0')) || [];
    const winningNumbers = item.winningNumbers?.L?.map((num) => parseInt(num.N || '0')) || [];

    return UserLottoEntity.fromSchema({
      userId: item.userId?.S || '',
      purchasedNumbers,
      purchasedDate: item.purchasedDate.S ?? '',
      round: parseInt(item.round?.N || '0'),
      prizeStatus: item.prizeStatus?.S as PrizeStatus,
      winningNumbers: winningNumbers.length > 0 ? winningNumbers : undefined,
      bonusNumber: item.bonusNumber?.N ? parseInt(item.bonusNumber.N) : undefined,
      rank: item.rank?.N ? parseInt(item.rank.N) : undefined,
    });
  }
}
