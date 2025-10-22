import { Controller } from '@nestjs/common';
import { LottoService } from './lotto.service';
import { Resource, Tool } from '@rekog/mcp-nest';
import { getUserLottoRequestDto, GetUserLottoRequestDto } from './dto/get-user-lotto-request.dto';

@Controller()
export class LottoMCPResourceController {
  constructor(private readonly _lottoService: LottoService) {}

  @Resource({
    name: 'Get-Lotto-Statistics',
    description: 'Get Lotto number statistics for a specific period',
    // MCP Resource의 URI 템플릿
    uri: 'lotto://statistics',
    // MIME 타입 지정
    mimeType: 'application/json',
  })
  public async getLottoStatistics() {
    return {
      period: {
        startRound: 1160,
        endRound: 1193,
        totalRounds: 34,
        bonusIncluded: true,
      },
      statistics: {
        '1': 3,
        '2': 4,
        '3': 8,
        '4': 5,
        '5': 4,
        '6': 8,
        '7': 7,
        '8': 5,
        '9': 7,
        '10': 2,
        '11': 6,
        '12': 6,
        '13': 6,
        '14': 4,
        '15': 3,
        '16': 8,
        '17': 8,
        '18': 5,
        '19': 7,
        '20': 6,
        '21': 6,
        '22': 6,
        '23': 8,
        '24': 7,
        '25': 6,
        '26': 3,
        '27': 5,
        '28': 7,
        '29': 8,
        '30': 3,
        '31': 6,
        '32': 2,
        '33': 4,
        '34': 2,
        '35': 5,
        '36': 4,
        '37': 6,
        '38': 5,
        '39': 6,
        '40': 6,
        '41': 3,
        '42': 8,
        '43': 3,
        '44': 3,
        '45': 4,
      },
      analysis: {
        maxFrequency: 8,
        maxFrequencyNumbers: [3, 6, 16, 17, 23, 29, 42],
        minFrequency: 2,
        minFrequencyNumbers: [10, 32, 34],
        totalAppearances: 238,
      },
      colorGroups: {
        yellow: {
          range: '1-10',
          numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          totalAppearances: 53,
        },
        blue: {
          range: '11-20',
          numbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
          totalAppearances: 59,
        },
        red: {
          range: '21-30',
          numbers: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
          totalAppearances: 63,
        },
        gray: {
          range: '31-40',
          numbers: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
          totalAppearances: 47,
        },
        green: {
          range: '41-45',
          numbers: [41, 42, 43, 44, 45],
          totalAppearances: 21,
        },
      },
    };
  }
}
