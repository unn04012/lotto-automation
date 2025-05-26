import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SlackConfigService } from 'src/config/slack/slack.config.service';

export interface LotteryResult {
  myNumbers: number[];
  winningNumbers: number[];
  rank: number;
}

export interface PurchaseInfo {
  game: string;
  purchasedNumbers: number[];
  purchasedDate: Date;
}

@Injectable()
export class NotificationSlackService {
  constructor(
    private readonly slackConfigService: SlackConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * 로또 당첨 결과 알림
   */
  public async sendLotteryResultNotification(result: LotteryResult): Promise<void> {
    const rankEmoji = this.getRankEmoji(result.rank);
    const rankText = this.getRankText(result.rank);

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🎰 로또 당첨 결과 ${rankEmoji}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*🎫 내 번호:*\n\`${result.myNumbers.join(' ')}\``,
            },
            {
              type: 'mrkdwn',
              text: `*🏆 당첨 번호:*\n\`${result.winningNumbers.join(' ')}\``,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🏅 등수:* ${rankText}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 ${new Date().toLocaleString('ko-KR')}에 확인됨`,
            },
          ],
        },
      ],
    };

    await this.sendSlackMessage(payload);
  }

  /**
   * 로또 구매 완료 알림
   */
  public async sendPurchaseCompletionNotification(purchase: PurchaseInfo): Promise<void> {
    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ 구매 완료',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*구매가 완료되었습니다* 🎊',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*🎮 게임:*\n${purchase.game}`,
            },
            {
              type: 'mrkdwn',
              text: `*🎲 구매번호:*\n\`${purchase.purchasedNumbers.join(' ')}\``,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 ${purchase.purchasedDate.toLocaleString('ko-KR')}에 구매됨`,
            },
          ],
        },
      ],
    };

    await this.sendSlackMessage(payload);
  }

  /**
   * 간단한 텍스트 메시지 전송 (기존 호환성 유지)
   */
  public async sendNotification(message: string): Promise<void> {
    const payload = {
      text: message,
    };

    await this.sendSlackMessage(payload);
  }

  /**
   * Slack 메시지 전송 공통 메서드
   */
  private async sendSlackMessage(payload: any): Promise<void> {
    const webhookUrl = this.slackConfigService.slackWebhookUrl;

    await firstValueFrom(this.httpService.post(webhookUrl, payload));
  }

  /**
   * 등수에 따른 이모지 반환
   */
  private getRankEmoji(rank: number): string {
    const emojiMap: { [key: number]: string } = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
      4: '🎖️',
      5: '🏅',
    };

    return emojiMap[rank] || '🎯';
  }

  /**
   * 등수에 따른 텍스트 반환
   */
  private getRankText(rank: number): string {
    const rankMap: { [key: number]: string } = {
      1: '1등 🎉',
      2: '2등 🎊',
      3: '3등 👏',
      4: '4등 😊',
      5: '5등 😄',
    };

    return rankMap[rank] || `${rank}등`;
  }
}
