import { UserLottoEntity } from '../domain/user-lotto.entity';
import { DynamoDBConfigService } from 'src/config/dynamodb/dynamodb-config.service';
import { IUserLottoRepository, LottoType, LottoTypeEnum, PrizeStatus } from './user-lotto.repository.interface';
import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserLottoRepositoryDynamoDB implements IUserLottoRepository {
  private readonly _client: DynamoDBClient;
  private readonly _logger = new Logger(UserLottoRepositoryDynamoDB.name);

  constructor(private readonly _dynamoDBConfig: DynamoDBConfigService) {
    this._client = this._dynamoDBConfig.client;
  }

  public async findByPurchaseId(purchaseId: string): Promise<UserLottoEntity | null> {
    const params: GetItemCommandInput = {
      TableName: 'UserLotto',
      Key: {
        purchaseId: { S: purchaseId },
      },
    };

    try {
      const result = await this._client.send(new GetItemCommand(params));

      if (!result.Item) {
        return null; // 아이템이 없으면 null 반환
      }

      return this._mapDynamoDBItemToEntity(result.Item);
    } catch (error) {
      this._logger.error('Error querying user lotto by purchaseId:', error);
      throw error;
    }
  }

  public async getUserLottoById(userId: string, round: number): Promise<UserLottoEntity[]> {
    const params: QueryCommandInput = {
      TableName: 'UserLotto',
      IndexName: 'UserLottoRoundIndex', // 앞서 생성한 GSI 이름
      KeyConditionExpression: 'userId = :userId AND lottoType = :lottoType',
      FilterExpression: 'round = :round',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':lottoType': { S: LottoTypeEnum.LOTTO },
        ':round': { N: String(round) },
      },
    };

    try {
      const result = await this._client.send(new QueryCommand(params));
      console.log(result.Items);
      if (!result.Items || result.Items.length === 0) {
        return []; // 결과가 없을 경우 빈 배열 반환
      }

      return result.Items.map((item) => this._mapDynamoDBItemToEntity(item));
    } catch (error) {
      this._logger.error('Error querying user lotto:', error);
      throw error;
    }
  }
  public async getUserLottoByRound(round: number): Promise<UserLottoEntity | null> {
    throw new Error('Method not implemented.');
  }

  public async save(entity: UserLottoEntity): Promise<UserLottoEntity> {
    await this._putItemCommand(entity);

    return entity;
  }

  private async _putItemCommand(userLotto: UserLottoEntity) {
    const param: PutItemCommandInput = {
      TableName: 'UserLotto',
      Item: {
        purchaseId: {
          S: userLotto.purchaseId,
        },
        userId: {
          S: userLotto.userId,
        },
        lottoType: {
          S: userLotto.lottoType,
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
      lottoType: item.lottoType?.S as LottoType,
      purchaseId: item.purchaseId?.S as string,
    });
  }
}
