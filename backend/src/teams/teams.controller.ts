import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CurrentUser } from '@nestjs/authentication';
import type { PublicUser } from '../users/users.repository.js';
import { TeamsService } from './teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: PublicUser,
  ) {
    if (
      typeof createTeamDto?.name !== 'string' ||
      createTeamDto.name.trim().length === 0
    ) {
      throw new BadRequestException('Team name is required');
    }

    return this.teamsService.create(createTeamDto.name.trim(), user.id);
  }

  @Get()
  findAll(@CurrentUser() user: PublicUser) {
    return this.teamsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: PublicUser) {
    return this.teamsService.addMember(id, user.id);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@Param('id') id: string, @CurrentUser() user: PublicUser) {
    await this.teamsService.removeMember(id, user.id);
  }
}
