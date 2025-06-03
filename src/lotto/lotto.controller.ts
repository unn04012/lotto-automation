import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LottoService } from './lotto.service';
import { LottoType } from './repository/user-lotto.repository.interface';

@Controller('prod/lotto')
export class LottoController {
  constructor(private readonly lottoService: LottoService) {}

  @Post()
  public async buyLotto() {
    await this.lottoService.buyLotto();
  }

  @Get('type/:type')
  public async getUserLotto(@Param('type') type: LottoType, @Query('round') round?: string) {
    return this.lottoService.getUserLotto(type, round);
  }

  @Post('check-results')
  public async updateUser() {
    return this.lottoService.updateUserLottoRank('LOTTO');
  }
}
