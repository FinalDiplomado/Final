"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const add_interface_dto_1 = require("./dto/add-interface.dto");
const create_evaluation_dto_1 = require("./dto/create-evaluation.dto");
const create_question_dto_1 = require("./dto/create-question.dto");
const create_task_dto_1 = require("./dto/create-task.dto");
const submit_answers_dto_1 = require("./dto/submit-answers.dto");
const submit_task_attempt_dto_1 = require("./dto/submit-task-attempt.dto");
const manual_modules_dto_1 = require("./dto/manual-modules.dto");
const evaluations_service_1 = require("./evaluations.service");
let EvaluationsController = class EvaluationsController {
    evaluations;
    constructor(evaluations) {
        this.evaluations = evaluations;
    }
    getUser(req) {
        const user = req.user;
        if (!user)
            throw new common_1.UnauthorizedException();
        return user;
    }
    create(req, dto) {
        return this.evaluations.create(this.getUser(req), dto);
    }
    listMine(req) {
        return this.evaluations.listMine(this.getUser(req));
    }
    getById(req, id) {
        return this.evaluations.getById(this.getUser(req), id);
    }
    updateScoringWeights(req, id, dto) {
        return this.evaluations.updateScoringWeights(this.getUser(req), id, dto);
    }
    deleteEvaluation(req, id) {
        return this.evaluations.deleteEvaluation(this.getUser(req), id);
    }
    getReport(req, id) {
        return this.evaluations.getReport(this.getUser(req), id);
    }
    getResultsBreakdown(req, id) {
        return this.evaluations.getResultsBreakdown(this.getUser(req), id);
    }
    getInterfaceBreakdown(req, id) {
        return this.evaluations.getInterfaceBreakdown(this.getUser(req), id);
    }
    getCompleteness(req, id) {
        return this.evaluations.getCompleteness(this.getUser(req), id);
    }
    addInterface(req, id, dto) {
        return this.evaluations.addInterface(this.getUser(req), id, dto);
    }
    updateInterface(req, interfaceId, dto) {
        return this.evaluations.updateInterface(this.getUser(req), interfaceId, dto);
    }
    deleteInterface(req, interfaceId) {
        return this.evaluations.deleteInterface(this.getUser(req), interfaceId);
    }
    addQuestion(req, interfaceId, dto) {
        return this.evaluations.addQuestion(this.getUser(req), interfaceId, dto);
    }
    updateQuestion(req, questionId, dto) {
        return this.evaluations.updateQuestion(this.getUser(req), questionId, dto);
    }
    deleteQuestion(req, questionId) {
        return this.evaluations.deleteQuestion(this.getUser(req), questionId);
    }
    addTask(req, interfaceId, dto) {
        return this.evaluations.addTask(this.getUser(req), interfaceId, dto);
    }
    updateTask(req, taskId, dto) {
        return this.evaluations.updateTask(this.getUser(req), taskId, dto);
    }
    deleteTask(req, taskId) {
        return this.evaluations.deleteTask(this.getUser(req), taskId);
    }
    submitAnswers(req, id, dto) {
        return this.evaluations.submitAnswers(this.getUser(req), id, dto);
    }
    getMyAnswers(req, id, interfaceId) {
        return this.evaluations.getMyAnswers(this.getUser(req), id, interfaceId);
    }
    async downloadReportPdf(req, id, res) {
        const pdf = await this.evaluations.getReportPdf(this.getUser(req), id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="evaluacion-${id}-reporte.pdf"`);
        return new common_1.StreamableFile(pdf);
    }
    getMySelection(req, id) {
        return this.evaluations.getMySelection(this.getUser(req), id);
    }
    selectInterface(req, id, dto) {
        return this.evaluations.selectInterface(this.getUser(req), id, dto.interfaceId);
    }
    submitTaskAttempt(req, id, dto) {
        return this.evaluations.submitTaskAttempt(this.getUser(req), id, dto);
    }
    computeResults(req, id) {
        return this.evaluations.computeResults(this.getUser(req), id);
    }
    listManualUserStories(req, id) {
        return this.evaluations.listManualUserStories(this.getUser(req), id);
    }
    createManualUserStory(req, id, dto) {
        return this.evaluations.createManualUserStory(this.getUser(req), id, dto);
    }
    updateManualUserStory(req, id, storyId, dto) {
        return this.evaluations.updateManualUserStory(this.getUser(req), id, storyId, dto);
    }
    deleteManualUserStory(req, id, storyId) {
        return this.evaluations.deleteManualUserStory(this.getUser(req), id, storyId);
    }
    listEvaluators(req, id) {
        return this.evaluations.listEvaluators(this.getUser(req), id);
    }
    assignEvaluator(req, id, dto) {
        return this.evaluations.assignEvaluatorByEmail(this.getUser(req), id, dto.email);
    }
    removeEvaluator(req, id, evaluatorId) {
        return this.evaluations.removeEvaluator(this.getUser(req), id, evaluatorId);
    }
    startSession(req, id) {
        return this.evaluations.startSession(this.getUser(req), id);
    }
    endSession(req, id, dto) {
        return this.evaluations.endSession(this.getUser(req), id, dto.notes);
    }
    listAudit(req, id) {
        return this.evaluations.listAudit(this.getUser(req), id);
    }
};
exports.EvaluationsController = EvaluationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_evaluation_dto_1.CreateEvaluationDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id/scoring-weights'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.UpdateScoringWeightsDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "updateScoringWeights", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "deleteEvaluation", null);
__decorate([
    (0, common_1.Get)(':id/report'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)(':id/results-breakdown'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getResultsBreakdown", null);
__decorate([
    (0, common_1.Get)(':id/interface-breakdown'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getInterfaceBreakdown", null);
__decorate([
    (0, common_1.Get)(':id/completeness'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getCompleteness", null);
__decorate([
    (0, common_1.Post)(':id/interfaces'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, add_interface_dto_1.AddInterfaceDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "addInterface", null);
__decorate([
    (0, common_1.Patch)('/interfaces/:interfaceId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('interfaceId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.UpdateInterfaceDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "updateInterface", null);
__decorate([
    (0, common_1.Delete)('/interfaces/:interfaceId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('interfaceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "deleteInterface", null);
__decorate([
    (0, common_1.Post)('/interfaces/:interfaceId/questions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('interfaceId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, create_question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "addQuestion", null);
__decorate([
    (0, common_1.Patch)('/questions/:questionId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('questionId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.UpdateQuestionDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)('/questions/:questionId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('questionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "deleteQuestion", null);
__decorate([
    (0, common_1.Post)('/interfaces/:interfaceId/tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('interfaceId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, create_task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "addTask", null);
__decorate([
    (0, common_1.Patch)('/tasks/:taskId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Delete)('/tasks/:taskId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "deleteTask", null);
__decorate([
    (0, common_1.Post)(':id/answers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, submit_answers_dto_1.SubmitAnswersDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "submitAnswers", null);
__decorate([
    (0, common_1.Get)(':id/answers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('interfaceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getMyAnswers", null);
__decorate([
    (0, common_1.Get)(':id/report.pdf'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "downloadReportPdf", null);
__decorate([
    (0, common_1.Get)(':id/selection'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "getMySelection", null);
__decorate([
    (0, common_1.Post)(':id/selection'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.SelectInterfaceDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "selectInterface", null);
__decorate([
    (0, common_1.Post)(':id/task-attempts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, submit_task_attempt_dto_1.SubmitTaskAttemptDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "submitTaskAttempt", null);
__decorate([
    (0, common_1.Post)(':id/compute-results'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "computeResults", null);
__decorate([
    (0, common_1.Get)(':id/manual-user-stories'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "listManualUserStories", null);
__decorate([
    (0, common_1.Post)(':id/manual-user-stories'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.CreateManualUserStoryDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "createManualUserStory", null);
__decorate([
    (0, common_1.Patch)(':id/manual-user-stories/:storyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('storyId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, manual_modules_dto_1.UpdateManualUserStoryDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "updateManualUserStory", null);
__decorate([
    (0, common_1.Delete)(':id/manual-user-stories/:storyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('storyId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "deleteManualUserStory", null);
__decorate([
    (0, common_1.Get)(':id/evaluators'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "listEvaluators", null);
__decorate([
    (0, common_1.Post)(':id/evaluators'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.AssignEvaluatorDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "assignEvaluator", null);
__decorate([
    (0, common_1.Delete)(':id/evaluators/:evaluatorId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('evaluatorId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "removeEvaluator", null);
__decorate([
    (0, common_1.Post)(':id/sessions/start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)(':id/sessions/end'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, manual_modules_dto_1.EndSessionDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)(':id/audit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "listAudit", null);
exports.EvaluationsController = EvaluationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('evaluations'),
    __metadata("design:paramtypes", [evaluations_service_1.EvaluationsService])
], EvaluationsController);
//# sourceMappingURL=evaluations.controller.js.map