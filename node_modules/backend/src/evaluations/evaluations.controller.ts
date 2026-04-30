import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddInterfaceDto } from './dto/add-interface.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { SubmitTaskAttemptDto } from './dto/submit-task-attempt.dto';
import {
  AssignEvaluatorDto,
  CreateManualUserStoryDto,
  EndSessionDto,
  SelectInterfaceDto,
  UpdateInterfaceDto,
  UpdateManualUserStoryDto,
  UpdateQuestionDto,
  UpdateScoringWeightsDto,
  UpdateTaskDto,
} from './dto/manual-modules.dto';
import { EvaluationsService } from './evaluations.service';

@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluations: EvaluationsService) {}

  private getUser(req: Request & { user?: JwtUser }) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    return user;
  }

  @Post()
  create(
    @Req() req: Request & { user?: JwtUser },
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.evaluations.create(this.getUser(req), dto);
  }

  @Get()
  listMine(@Req() req: Request & { user?: JwtUser }) {
    return this.evaluations.listMine(this.getUser(req));
  }

  @Get(':id')
  getById(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.getById(this.getUser(req), id);
  }

  @Patch(':id/scoring-weights')
  updateScoringWeights(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScoringWeightsDto,
  ) {
    return this.evaluations.updateScoringWeights(this.getUser(req), id, dto);
  }

  @Delete(':id')
  deleteEvaluation(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.deleteEvaluation(this.getUser(req), id);
  }

  @Get(':id/report')
  getReport(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.getReport(this.getUser(req), id);
  }

  @Get(':id/results-breakdown')
  getResultsBreakdown(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.getResultsBreakdown(this.getUser(req), id);
  }

  @Get(':id/interface-breakdown')
  getInterfaceBreakdown(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.getInterfaceBreakdown(this.getUser(req), id);
  }

  @Get(':id/completeness')
  getCompleteness(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.getCompleteness(this.getUser(req), id);
  }

  @Post(':id/interfaces')
  addInterface(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddInterfaceDto,
  ) {
    return this.evaluations.addInterface(this.getUser(req), id, dto);
  }

  @Patch('/interfaces/:interfaceId')
  updateInterface(
    @Req() req: Request & { user?: JwtUser },
    @Param('interfaceId', ParseIntPipe) interfaceId: number,
    @Body() dto: UpdateInterfaceDto,
  ) {
    return this.evaluations.updateInterface(
      this.getUser(req),
      interfaceId,
      dto,
    );
  }

  @Delete('/interfaces/:interfaceId')
  deleteInterface(
    @Req() req: Request & { user?: JwtUser },
    @Param('interfaceId', ParseIntPipe) interfaceId: number,
  ) {
    return this.evaluations.deleteInterface(this.getUser(req), interfaceId);
  }

  @Post('/interfaces/:interfaceId/questions')
  addQuestion(
    @Req() req: Request & { user?: JwtUser },
    @Param('interfaceId', ParseIntPipe) interfaceId: number,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.evaluations.addQuestion(this.getUser(req), interfaceId, dto);
  }

  @Patch('/questions/:questionId')
  updateQuestion(
    @Req() req: Request & { user?: JwtUser },
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.evaluations.updateQuestion(this.getUser(req), questionId, dto);
  }

  @Delete('/questions/:questionId')
  deleteQuestion(
    @Req() req: Request & { user?: JwtUser },
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.evaluations.deleteQuestion(this.getUser(req), questionId);
  }

  @Post('/interfaces/:interfaceId/tasks')
  addTask(
    @Req() req: Request & { user?: JwtUser },
    @Param('interfaceId', ParseIntPipe) interfaceId: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.evaluations.addTask(this.getUser(req), interfaceId, dto);
  }

  @Patch('/tasks/:taskId')
  updateTask(
    @Req() req: Request & { user?: JwtUser },
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.evaluations.updateTask(this.getUser(req), taskId, dto);
  }

  @Delete('/tasks/:taskId')
  deleteTask(
    @Req() req: Request & { user?: JwtUser },
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.evaluations.deleteTask(this.getUser(req), taskId);
  }

  @Post(':id/answers')
  submitAnswers(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.evaluations.submitAnswers(this.getUser(req), id, dto);
  }

  @Get(':id/answers')
  getMyAnswers(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Query('interfaceId', ParseIntPipe) interfaceId: number,
  ) {
    return this.evaluations.getMyAnswers(this.getUser(req), id, interfaceId);
  }

  @Get(':id/report.pdf')
  async downloadReportPdf(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdf = await this.evaluations.getReportPdf(this.getUser(req), id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="evaluacion-${id}-reporte.pdf"`,
    );
    return new StreamableFile(pdf);
  }

  @Get(':id/selection')
  getMySelection(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.getMySelection(this.getUser(req), id);
  }

  @Post(':id/selection')
  selectInterface(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SelectInterfaceDto,
  ) {
    return this.evaluations.selectInterface(
      this.getUser(req),
      id,
      dto.interfaceId,
    );
  }

  @Post(':id/task-attempts')
  submitTaskAttempt(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitTaskAttemptDto,
  ) {
    return this.evaluations.submitTaskAttempt(this.getUser(req), id, dto);
  }

  @Post(':id/compute-results')
  computeResults(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.computeResults(this.getUser(req), id);
  }

  @Get(':id/manual-user-stories')
  listManualUserStories(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.listManualUserStories(this.getUser(req), id);
  }

  @Post(':id/manual-user-stories')
  createManualUserStory(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateManualUserStoryDto,
  ) {
    return this.evaluations.createManualUserStory(this.getUser(req), id, dto);
  }

  @Patch(':id/manual-user-stories/:storyId')
  updateManualUserStory(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() dto: UpdateManualUserStoryDto,
  ) {
    return this.evaluations.updateManualUserStory(
      this.getUser(req),
      id,
      storyId,
      dto,
    );
  }

  @Delete(':id/manual-user-stories/:storyId')
  deleteManualUserStory(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Param('storyId', ParseIntPipe) storyId: number,
  ) {
    return this.evaluations.deleteManualUserStory(
      this.getUser(req),
      id,
      storyId,
    );
  }

  @Get(':id/evaluators')
  listEvaluators(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.listEvaluators(this.getUser(req), id);
  }

  @Post(':id/evaluators')
  assignEvaluator(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEvaluatorDto,
  ) {
    return this.evaluations.assignEvaluatorByEmail(
      this.getUser(req),
      id,
      dto.email,
    );
  }

  @Delete(':id/evaluators/:evaluatorId')
  removeEvaluator(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Param('evaluatorId', ParseIntPipe) evaluatorId: number,
  ) {
    return this.evaluations.removeEvaluator(this.getUser(req), id, evaluatorId);
  }

  @Post(':id/sessions/start')
  startSession(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.startSession(this.getUser(req), id);
  }

  @Post(':id/sessions/end')
  endSession(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndSessionDto,
  ) {
    return this.evaluations.endSession(this.getUser(req), id, dto.notes);
  }

  @Get(':id/audit')
  listAudit(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluations.listAudit(this.getUser(req), id);
  }
}
