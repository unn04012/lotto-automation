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

export interface ErrorInfo {
  service: string;
  method: string;
  message: string;
  stack?: string;
  userId?: string;
  context?: any;
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
   * 에러 발생 알림
   */
  public async sendErrorNotification(errorInfo: ErrorInfo): Promise<void> {
    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 에러 발생',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*시스템에서 에러가 발생했습니다* ⚠️',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*🔧 서비스:*\n${errorInfo.service}`,
            },
            {
              type: 'mrkdwn',
              text: `*📍 메서드:*\n${errorInfo.method}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*💬 에러 메시지:*\n\`\`\`${errorInfo.message}\`\`\``,
          },
        },
        ...(errorInfo.userId
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*👤 사용자 ID:*\n${errorInfo.userId}`,
                },
              },
            ]
          : []),
        ...(errorInfo.context
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*🔍 추가 정보:*\n\`\`\`${JSON.stringify(errorInfo.context, null, 2)}\`\`\``,
                },
              },
            ]
          : []),
        ...(errorInfo.stack
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*📋 스택 트레이스:*\n\`\`\`${this.truncateStack(errorInfo.stack)}\`\`\``,
                },
              },
            ]
          : []),
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ ${new Date().toLocaleString('ko-KR')}에 발생`,
            },
          ],
        },
      ],
    };

    await this.sendSlackMessage(payload);
  }

  /**
   * 중요한 시스템 에러 알림 (멘션 포함)
   */
  public async sendCriticalErrorNotification(errorInfo: ErrorInfo, mentionUserIds?: string[]): Promise<void> {
    const mentions = mentionUserIds?.map((id) => `<@${id}>`).join(' ') || '';

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔥 중요 시스템 에러',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*즉시 확인이 필요한 중요한 에러가 발생했습니다* 🚨\n${mentions}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*🔧 서비스:*\n${errorInfo.service}`,
            },
            {
              type: 'mrkdwn',
              text: `*📍 메서드:*\n${errorInfo.method}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*💬 에러 메시지:*\n\`\`\`${errorInfo.message}\`\`\``,
          },
        },
        ...(errorInfo.context
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*🔍 추가 정보:*\n\`\`\`${JSON.stringify(errorInfo.context, null, 2)}\`\`\``,
                },
              },
            ]
          : []),
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ ${new Date().toLocaleString('ko-KR')}에 발생`,
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
    try {
      const webhookUrl = this.slackConfigService.slackWebhookUrl;
      await firstValueFrom(this.httpService.post(webhookUrl, payload));
    } catch (error) {
      // Slack 전송 실패 시 콘솔에 로그만 남기고 에러를 던지지 않음
      console.error('Slack 메시지 전송 실패:', error.message);
    }
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

  /**
   * 스택 트레이스 길이 제한 (Slack 메시지 길이 제한 고려)
   */
  private truncateStack(stack: string, maxLength: number = 1500): string {
    if (stack.length <= maxLength) {
      return stack;
    }

    return stack.substring(0, maxLength) + '\n...\n[스택 트레이스가 잘렸습니다]';
  }
}
