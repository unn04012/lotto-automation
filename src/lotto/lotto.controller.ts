import { Controller, Get, Param, Post } from '@nestjs/common';
import { LottoService } from './lotto.service';

@Controller('lotto')
export class LottoController {
  constructor(private readonly lottoService: LottoService) {}

  @Post()
  public async buyLotto() {
    await this.lottoService.buyLotto();
  }

  @Get(':round')
  public async getUserLotto(@Param('round') round: number) {
    return this.lottoService.getUserLotto(round);
  }
}
