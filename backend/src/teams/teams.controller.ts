import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { TeamsService } from './teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { AddTeamMemberDto } from './dto/add-team-member.dto.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    if (
      typeof createTeamDto?.name !== 'string' ||
      createTeamDto.name.trim().length === 0
    ) {
      throw new BadRequestException('Team name is required');
    }
    return this.teamsService.create(createTeamDto.name.trim());
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
  ) {
    if (
      !Number.isInteger(addTeamMemberDto?.userId) ||
      addTeamMemberDto.userId <= 0
    ) {
      throw new BadRequestException('A valid user ID is required');
    }
    return this.teamsService.addMember(id, addTeamMemberDto.userId);
  }

  @Delete(':teamId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.teamsService.removeMember(teamId, userId);
  }
}
