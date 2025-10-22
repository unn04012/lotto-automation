import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LottoService } from './lotto.service';
import { LottoType } from './repository/user-lotto.repository.interface';
import { CreateLottoRequestDto } from './dto/create-lotto-request.dto';

@Controller('prod/lotto')
export class LottoController {
  constructor(private readonly lottoService: LottoService) {}

  @Post()
  public async buyLotto() {
    await this.lottoService.buyLotto();
  }

  @Post('manual')
  public async buyLottoManual(@Body() dto: CreateLottoRequestDto) {
    return await this.lottoService.buyLottoManual(dto.purchasedNumbers);
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
