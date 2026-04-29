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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuestionDto = exports.UpdateTaskDto = exports.UpdateScoringWeightsDto = exports.UpdateInterfaceDto = exports.UpdateManualUserStoryDto = exports.CreateManualUserStoryDto = exports.EndSessionDto = exports.StartSessionDto = exports.SelectInterfaceDto = exports.AssignEvaluatorDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class AssignEvaluatorDto {
    email;
}
exports.AssignEvaluatorDto = AssignEvaluatorDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AssignEvaluatorDto.prototype, "email", void 0);
class SelectInterfaceDto {
    interfaceId;
}
exports.SelectInterfaceDto = SelectInterfaceDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SelectInterfaceDto.prototype, "interfaceId", void 0);
class StartSessionDto {
}
exports.StartSessionDto = StartSessionDto;
class EndSessionDto {
    notes;
}
exports.EndSessionDto = EndSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EndSessionDto.prototype, "notes", void 0);
class CreateManualUserStoryDto {
    interfaceId;
    recommendedInterfaceId;
    title;
    narrative;
    acceptanceCriteria;
    status;
    mosCow;
    priority;
    riceReach;
    riceImpact;
    riceConfidence;
    riceEffort;
}
exports.CreateManualUserStoryDto = CreateManualUserStoryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "interfaceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "recommendedInterfaceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManualUserStoryDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManualUserStoryDto.prototype, "narrative", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManualUserStoryDto.prototype, "acceptanceCriteria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StoryStatus),
    __metadata("design:type", String)
], CreateManualUserStoryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MoSCoWPriority),
    __metadata("design:type", String)
], CreateManualUserStoryDto.prototype, "mosCow", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "riceReach", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "riceImpact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "riceConfidence", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateManualUserStoryDto.prototype, "riceEffort", void 0);
class UpdateManualUserStoryDto {
    interfaceId;
    recommendedInterfaceId;
    title;
    narrative;
    acceptanceCriteria;
    status;
    mosCow;
    priority;
    riceReach;
    riceImpact;
    riceConfidence;
    riceEffort;
}
exports.UpdateManualUserStoryDto = UpdateManualUserStoryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "interfaceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "recommendedInterfaceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateManualUserStoryDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateManualUserStoryDto.prototype, "narrative", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateManualUserStoryDto.prototype, "acceptanceCriteria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StoryStatus),
    __metadata("design:type", String)
], UpdateManualUserStoryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MoSCoWPriority),
    __metadata("design:type", String)
], UpdateManualUserStoryDto.prototype, "mosCow", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "riceReach", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "riceImpact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "riceConfidence", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateManualUserStoryDto.prototype, "riceEffort", void 0);
class UpdateInterfaceDto {
    name;
    imageUrl;
    prototypeUrl;
    order;
}
exports.UpdateInterfaceDto = UpdateInterfaceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInterfaceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInterfaceDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInterfaceDto.prototype, "prototypeUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateInterfaceDto.prototype, "order", void 0);
class UpdateScoringWeightsDto {
    effectiveness;
    efficiency;
    satisfaction;
}
exports.UpdateScoringWeightsDto = UpdateScoringWeightsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateScoringWeightsDto.prototype, "effectiveness", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateScoringWeightsDto.prototype, "efficiency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateScoringWeightsDto.prototype, "satisfaction", void 0);
class UpdateTaskDto {
    title;
    description;
    targetTimeSec;
    targetSteps;
    order;
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "targetTimeSec", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "targetSteps", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "order", void 0);
class UpdateQuestionDto {
    dimension;
    type;
    prompt;
    helpText;
    isRequired;
    weight;
    order;
}
exports.UpdateQuestionDto = UpdateQuestionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.UsabilityDimension),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "dimension", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.QuestionType),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "prompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "helpText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateQuestionDto.prototype, "isRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "order", void 0);
//# sourceMappingURL=manual-modules.dto.js.map