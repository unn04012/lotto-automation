import { Controller } from '@nestjs/common';
import { LottoService } from './lotto.service';
import { Tool } from '@rekog/mcp-nest';
import { getUserLottoRequestDto, GetUserLottoRequestDto } from './dto/get-user-lotto-request.dto';
import { CreateUserLottoRequestDto, createUserLottoRequestDto } from './dto/create-user-lotto-request.dto';
import { CreateLottoRequestDto, createLottoRequestDto } from './dto/create-lotto-request.dto';

@Controller()
export class LottoMCPToolController {
  constructor(private readonly _lottoService: LottoService) {}

  @Tool({
    name: 'Get-my-lotto-number',
    description: 'Get user lotto number by type and round',
    parameters: getUserLottoRequestDto,
  })
  public async getUserLotto(dto: GetUserLottoRequestDto) {
    const { type, round } = dto;

    return await this._lottoService.getUserLotto(type, round);
  }

  @Tool({
    name: 'Buy-Lotto-manually',
    description: 'Buy a new lotto ticket for the user',
    parameters: createLottoRequestDto,
  })
  public async buyLotto(dto: CreateLottoRequestDto) {
    const { purchasedNumbers } = dto;

    return await this._lottoService.buyLottoManual(purchasedNumbers);
  }

  @Tool({
    name: 'Create-Lotto-entity',
    description: 'Create a new lotto entry with specified numbers and round',
    parameters: createUserLottoRequestDto,
  })
  public async createLotto(dto: CreateUserLottoRequestDto) {
    const { purchasedNumbers, round } = dto;

    return await this._lottoService.createLotto(purchasedNumbers, round);
  }
}
