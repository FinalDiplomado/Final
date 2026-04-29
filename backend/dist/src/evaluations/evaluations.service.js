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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const puppeteer_1 = __importDefault(require("puppeteer"));
const prisma_service_1 = require("../prisma/prisma.service");
function clamp01(value) {
    if (Number.isNaN(value))
        return 0;
    return Math.max(0, Math.min(1, value));
}
function normalizeAnswer({ questionType, dimension, valueNumber, valueLikert, valueBoolean, }) {
    if (questionType === client_1.QuestionType.BOOLEAN) {
        return valueBoolean ? 1 : 0;
    }
    if (questionType === client_1.QuestionType.LIKERT_1_5) {
        if (!valueLikert)
            return 0;
        return clamp01((valueLikert - 1) / 4);
    }
    if (questionType === client_1.QuestionType.NUMBER) {
        const n = valueNumber ?? 0;
        if (dimension === client_1.UsabilityDimension.EFFICIENCY) {
            return clamp01(1 - n / 100);
        }
        return clamp01(n / 100);
    }
    return null;
}
let EvaluationsService = class EvaluationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logEvent(params) {
        const evaluationId = params.evaluationId ?? null;
        const entityId = params.entityId ?? null;
        await this.prisma.auditLog.create({
            data: {
                evaluationId,
                actorId: params.user.userId,
                action: params.action,
                entityType: params.entityType,
                entityId,
                data: (params.data ?? null),
            },
        });
    }
    async assertCanViewEvaluation(user, evaluationId) {
        if (user.role === client_1.RoleName.ADMIN)
            return;
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: {
                createdById: true,
                status: true,
                evaluators: {
                    where: { evaluatorId: user.userId },
                    select: { id: true },
                },
            },
        });
        if (!evaluation)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        if (evaluation.createdById === user.userId)
            return;
        if (evaluation.evaluators.length > 0) {
            if (evaluation.status === client_1.EvaluationStatus.DRAFT)
                throw new common_1.ForbiddenException();
            return;
        }
        throw new common_1.ForbiddenException();
    }
    async assertCanManageEvaluation(user, evaluationId) {
        if (user.role === client_1.RoleName.ADMIN)
            return;
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: { createdById: true },
        });
        if (!evaluation)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        if (evaluation.createdById !== user.userId) {
            throw new common_1.ForbiddenException();
        }
    }
    async assertCanSubmitEvaluationData(user, evaluationId) {
        if (user.role === client_1.RoleName.ADMIN) {
            throw new common_1.ForbiddenException('El administrador no puede registrar sesiones, intentos ni respuestas');
        }
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: {
                status: true,
                evaluators: {
                    where: { evaluatorId: user.userId },
                    select: { id: true },
                },
            },
        });
        if (!evaluation)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        if (evaluation.evaluators.length > 0) {
            if (evaluation.status === client_1.EvaluationStatus.DRAFT) {
                throw new common_1.ForbiddenException('La evaluación aún está en borrador. Espera a que el administrador la habilite.');
            }
            return;
        }
        throw new common_1.ForbiddenException();
    }
    async create(user, dto) {
        if (user.role !== client_1.RoleName.ADMIN) {
            throw new common_1.ForbiddenException('Solo el administrador puede crear evaluaciones');
        }
        const created = await this.prisma.evaluation.create({
            data: {
                title: dto.title,
                systemName: dto.systemName,
                userType: dto.userType,
                usageContext: dto.usageContext,
                status: client_1.EvaluationStatus.DRAFT,
                createdById: user.userId,
            },
        });
        await this.logEvent({
            user,
            evaluationId: created.id,
            action: 'CREATE',
            entityType: 'Evaluation',
            entityId: created.id,
            data: { title: created.title },
        });
        return created;
    }
    async listMine(user) {
        const where = user.role === client_1.RoleName.ADMIN
            ? {}
            : {
                OR: [
                    { createdById: user.userId },
                    { evaluators: { some: { evaluatorId: user.userId } } },
                ],
                status: { not: client_1.EvaluationStatus.DRAFT },
            };
        return this.prisma.evaluation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                systemName: true,
                userType: true,
                usageContext: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                createdBy: { select: { id: true, email: true, fullName: true } },
                _count: { select: { interfaces: true, evaluators: true } },
                result: {
                    select: {
                        effectivenessScore: true,
                        efficiencyScore: true,
                        satisfactionScore: true,
                        overallScore: true,
                        generatedAt: true,
                    },
                },
            },
        });
    }
    async deleteEvaluation(user, evaluationId) {
        await this.assertCanManageEvaluation(user, evaluationId);
        const existing = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: { id: true, title: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        await this.logEvent({
            user,
            evaluationId,
            action: 'DELETE',
            entityType: 'Evaluation',
            entityId: evaluationId,
            data: { title: existing.title },
        });
        await this.prisma.evaluation.delete({ where: { id: evaluationId } });
        return { ok: true };
    }
    async getById(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            include: {
                interfaces: {
                    orderBy: { order: 'asc' },
                    include: {
                        questions: { orderBy: { order: 'asc' } },
                        tasks: {
                            orderBy: { order: 'asc' },
                            include: {
                                attempts: { where: { evaluatorId: user.userId } },
                            },
                        },
                    },
                },
                selections: {
                    where: { evaluatorId: user.userId },
                    select: { interfaceId: true, createdAt: true },
                },
                result: {
                    include: {
                        userStories: {
                            orderBy: { priority: 'asc' },
                            include: {
                                recommendedInterface: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                manualUserStories: {
                    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
                    include: {
                        interface: { select: { id: true, name: true } },
                        recommendedInterface: { select: { id: true, name: true } },
                        createdBy: { select: { id: true, email: true, fullName: true } },
                    },
                },
                evaluators: {
                    include: {
                        evaluator: { select: { id: true, email: true, fullName: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                sessions: {
                    where: { evaluatorId: user.userId },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!evaluation)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        return evaluation;
    }
    async updateScoringWeights(user, evaluationId, dto) {
        await this.assertCanManageEvaluation(user, evaluationId);
        const existing = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: {
                scoringWeightEffectiveness: true,
                scoringWeightEfficiency: true,
                scoringWeightSatisfaction: true,
                status: true,
                result: { select: { id: true } },
            },
        });
        if (!existing)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const next = {
            scoringWeightEffectiveness: dto.effectiveness ?? existing.scoringWeightEffectiveness,
            scoringWeightEfficiency: dto.efficiency ?? existing.scoringWeightEfficiency,
            scoringWeightSatisfaction: dto.satisfaction ?? existing.scoringWeightSatisfaction,
        };
        const changed = existing.scoringWeightEffectiveness !== next.scoringWeightEffectiveness ||
            existing.scoringWeightEfficiency !== next.scoringWeightEfficiency ||
            existing.scoringWeightSatisfaction !== next.scoringWeightSatisfaction;
        const sum = next.scoringWeightEffectiveness +
            next.scoringWeightEfficiency +
            next.scoringWeightSatisfaction;
        if (sum <= 0) {
            throw new common_1.BadRequestException('Al menos un peso de scoring debe ser mayor que 0');
        }
        let invalidatedResult = false;
        const updated = await this.prisma.$transaction(async (tx) => {
            const upd = await tx.evaluation.update({
                where: { id: evaluationId },
                data: next,
                select: {
                    id: true,
                    scoringWeightEffectiveness: true,
                    scoringWeightEfficiency: true,
                    scoringWeightSatisfaction: true,
                },
            });
            if (changed && existing.result) {
                await tx.result.delete({ where: { evaluationId } });
                await tx.evaluation.update({
                    where: { id: evaluationId },
                    data: { status: client_1.EvaluationStatus.IN_PROGRESS },
                });
                invalidatedResult = true;
            }
            return upd;
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'UPDATE',
            entityType: 'Evaluation',
            entityId: evaluationId,
            data: { ...next, invalidatedResult },
        });
        return updated;
    }
    async getMySelection(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const selection = await this.prisma.interfaceSelection.findUnique({
            where: {
                evaluationId_evaluatorId: { evaluationId, evaluatorId: user.userId },
            },
            select: { interfaceId: true, createdAt: true, updatedAt: true },
        });
        return selection;
    }
    async selectInterface(user, evaluationId, interfaceId) {
        await this.assertCanSubmitEvaluationData(user, evaluationId);
        const intf = await this.prisma.interface.findUnique({
            where: { id: interfaceId },
            select: { id: true, evaluationId: true },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        if (intf.evaluationId !== evaluationId) {
            throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
        }
        const existing = await this.prisma.interfaceSelection.findUnique({
            where: {
                evaluationId_evaluatorId: { evaluationId, evaluatorId: user.userId },
            },
            select: { interfaceId: true },
        });
        if (existing && existing.interfaceId !== interfaceId) {
            throw new common_1.BadRequestException('Ya seleccionaste una interfaz para esta evaluación');
        }
        const selection = await this.prisma.interfaceSelection.upsert({
            where: {
                evaluationId_evaluatorId: { evaluationId, evaluatorId: user.userId },
            },
            update: { interfaceId },
            create: { evaluationId, evaluatorId: user.userId, interfaceId },
            select: { interfaceId: true, createdAt: true, updatedAt: true },
        });
        await this.prisma.evaluation.update({
            where: { id: evaluationId },
            data: { status: client_1.EvaluationStatus.IN_PROGRESS },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'SELECT',
            entityType: 'InterfaceSelection',
            data: { interfaceId },
        });
        return selection;
    }
    async getReport(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const meta = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: { createdById: true, status: true },
        });
        if (!meta)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const canSeeAllAttempts = user.role === client_1.RoleName.ADMIN || meta.createdById === user.userId;
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            include: {
                interfaces: {
                    orderBy: { order: 'asc' },
                    include: {
                        questions: { orderBy: { order: 'asc' } },
                        tasks: {
                            orderBy: { order: 'asc' },
                            include: {
                                attempts: canSeeAllAttempts
                                    ? true
                                    : { where: { evaluatorId: user.userId } },
                            },
                        },
                    },
                },
                result: {
                    include: {
                        userStories: {
                            orderBy: { priority: 'asc' },
                            include: {
                                recommendedInterface: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                manualUserStories: {
                    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
                    include: {
                        interface: { select: { id: true, name: true } },
                        recommendedInterface: { select: { id: true, name: true } },
                        createdBy: { select: { id: true, email: true, fullName: true } },
                    },
                },
                evaluators: {
                    include: {
                        evaluator: { select: { id: true, email: true, fullName: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                sessions: {
                    orderBy: { startedAt: 'desc' },
                    take: 50,
                    include: {
                        evaluator: { select: { id: true, email: true, fullName: true } },
                    },
                },
            },
        });
        if (!evaluation)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const interfaces = evaluation.interfaces.map((intf) => ({
            id: intf.id,
            name: intf.name,
            order: intf.order,
            imageUrl: intf.imageUrl,
            prototypeUrl: intf.prototypeUrl,
            tasks: intf.tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                order: t.order,
                targetTimeSec: t.targetTimeSec,
                targetSteps: t.targetSteps,
                attempts: t.attempts.map((a) => ({
                    completed: a.completed,
                    errorsCount: a.errorsCount,
                    timeSec: a.timeSec,
                    stepsCount: a.stepsCount,
                    notes: a.notes,
                    createdAt: a.createdAt,
                })),
            })),
            questions: intf.questions.map((q) => ({
                id: q.id,
                dimension: q.dimension,
                type: q.type,
                prompt: q.prompt,
                helpText: q.helpText,
                isRequired: q.isRequired,
                weight: q.weight,
            })),
        }));
        return {
            generatedAt: new Date().toISOString(),
            evaluation: {
                id: evaluation.id,
                title: evaluation.title,
                systemName: evaluation.systemName,
                userType: evaluation.userType,
                usageContext: evaluation.usageContext,
                scoringWeightEffectiveness: evaluation.scoringWeightEffectiveness,
                scoringWeightEfficiency: evaluation.scoringWeightEfficiency,
                scoringWeightSatisfaction: evaluation.scoringWeightSatisfaction,
                status: evaluation.status,
            },
            interfaces,
            evaluators: evaluation.evaluators,
            sessions: evaluation.sessions,
            manualUserStories: evaluation.manualUserStories,
            result: evaluation.result,
        };
    }
    async getReportPdf(user, evaluationId) {
        const report = await this.getReport(user, evaluationId);
        const escapeHtml = (text) => text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
        const fmtDateTime = (value) => {
            if (!value)
                return '—';
            const d = new Date(value);
            if (Number.isNaN(d.getTime()))
                return value;
            return d.toLocaleString();
        };
        const percent = (n) => `${Math.round(n * 100)}%`;
        const fmtUserType = (v) => v === 'NOVICE' ? 'Novato' : 'Experto';
        const fmtEvaluationStatus = (v) => {
            if (v === 'DRAFT')
                return 'Borrador';
            if (v === 'IN_PROGRESS')
                return 'En progreso';
            if (v === 'COMPLETED')
                return 'Completada';
            return v;
        };
        const kpisHtml = report.result
            ? `<div class="kpis">
  <div class="kpi">
    <div class="kpiLabel">Efectividad</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.effectivenessScore))}</div>
  </div>
  <div class="kpi">
    <div class="kpiLabel">Eficiencia</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.efficiencyScore))}</div>
  </div>
  <div class="kpi">
    <div class="kpiLabel">Satisfacción</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.satisfactionScore))}</div>
  </div>
  <div class="kpi">
    <div class="kpiLabel">Global</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.overallScore))}</div>
  </div>
</div>`
            : `<div class="muted">Aún no hay resultados calculados.</div>`;
        const conclusionsHtml = report.result?.conclusions
            ? `<div class="pre">${escapeHtml(report.result.conclusions)}</div>`
            : `<div class="muted">—</div>`;
        const recommendationsHtml = report.result?.recommendations
            ? `<div class="pre">${escapeHtml(report.result.recommendations)}</div>`
            : `<div class="muted">—</div>`;
        const winnerInterfaceId = report.result?.recommendedInterfaceId ?? null;
        const winnerInterface = (winnerInterfaceId
            ? (report.interfaces.find((i) => i.id === winnerInterfaceId) ?? null)
            : null) ??
            report.interfaces.slice().sort((a, b) => a.order - b.order)[0] ??
            null;
        const winnerInterfaceHtml = (() => {
            if (!winnerInterface)
                return `<div class="muted">No hay interfaz ganadora.</div>`;
            const img = winnerInterface.imageUrl && winnerInterface.imageUrl.trim()
                ? `<div class="imgWrap"><img class="img" src="${escapeHtml(winnerInterface.imageUrl)}" /></div>`
                : `<div class="muted">Sin imagen.</div>`;
            return `<div class="card">
  <div class="h">${escapeHtml(winnerInterface.name)}</div>
  ${img}
</div>`;
        })();
        const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Reporte evaluación ${evaluationId}</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 0; color: #111; }
  h1 { margin: 0 0 6px; font-size: 22px; }
  h2 { margin: 0 0 10px; font-size: 16px; }
  .muted { color: #666; }
  .small { font-size: 12px; }
  .strong { font-weight: 700; }
  .section { margin-top: 14px; page-break-inside: avoid; }
  .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .stack { display: grid; gap: 12px; }
  .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
  .cardTitle { font-weight: 700; margin-bottom: 8px; }
  .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
  .kpiLabel { font-size: 12px; color: #666; }
  .kpiValue { font-size: 18px; font-weight: 800; margin-top: 4px; }
  .h { font-weight: 800; font-size: 14px; margin: 4px 0 8px; }
  .pre { white-space: pre-wrap; word-break: break-word; background: #f6f7f8; padding: 10px; border-radius: 8px; }
  .imgWrap { width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #fff; }
  .img { display: block; width: 100%; height: auto; }
  .hr { height: 1px; background: #e5e7eb; margin: 12px 0; }
</style>
</head>
<body>
  <h1>Reporte de evaluación</h1>
  <div class="muted small">Generado: ${escapeHtml(fmtDateTime(report.generatedAt))}</div>

  <div class="hr"></div>

  <section class="section">
    <h2>Información general</h2>
    <div class="grid2">
      <div class="card">
        <div class="cardTitle">Evaluación</div>
        <div><span class="strong">Título:</span> ${escapeHtml(report.evaluation.title)}</div>
        <div><span class="strong">Sistema:</span> ${escapeHtml(report.evaluation.systemName)}</div>
        <div><span class="strong">Tipo de usuario:</span> ${escapeHtml(fmtUserType(report.evaluation.userType))}</div>
        <div><span class="strong">Estado:</span> ${escapeHtml(fmtEvaluationStatus(report.evaluation.status))}</div>
        <div class="pre">Efectividad: ${escapeHtml(String(report.evaluation.scoringWeightEffectiveness))} · Eficiencia: ${escapeHtml(String(report.evaluation.scoringWeightEfficiency))} · Satisfacción: ${escapeHtml(String(report.evaluation.scoringWeightSatisfaction))}</div>
      </div>
      <div class="card">
        <div class="cardTitle">Contexto de uso</div>
        <div class="pre">${escapeHtml(report.evaluation.usageContext || '—')}</div>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Métricas ISO 9241-11</h2>
    ${kpisHtml}
    <div class="grid2" style="margin-top: 12px;">
      <div class="card">
        <div class="cardTitle">Conclusiones</div>
        ${conclusionsHtml}
      </div>
      <div class="card">
        <div class="cardTitle">Recomendaciones</div>
        ${recommendationsHtml}
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Interfaz ganadora</h2>
    ${winnerInterfaceHtml}
  </section>
</body>
</html>`;
        let browser = null;
        try {
            browser = await puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
            });
            return Buffer.from(pdf);
        }
        finally {
            await browser?.close();
        }
    }
    async addInterface(user, evaluationId, dto) {
        await this.assertCanManageEvaluation(user, evaluationId);
        const prototypeUrl = dto.prototypeUrl && dto.prototypeUrl.trim()
            ? dto.prototypeUrl.trim()
            : undefined;
        const order = dto.order ??
            ((await this.prisma.interface.aggregate({
                where: { evaluationId },
                _max: { order: true },
            }))?._max.order ?? -1) + 1;
        const created = await this.prisma.interface.create({
            data: {
                evaluationId,
                name: dto.name,
                imageUrl: dto.imageUrl,
                prototypeUrl,
                order,
            },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'CREATE',
            entityType: 'Interface',
            entityId: created.id,
            data: { name: created.name, order: created.order },
        });
        return created;
    }
    async addQuestion(user, interfaceId, dto) {
        const intf = await this.prisma.interface.findUnique({
            where: { id: interfaceId },
            select: { evaluationId: true },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        await this.assertCanManageEvaluation(user, intf.evaluationId);
        const order = ((await this.prisma.question.aggregate({
            where: { interfaceId },
            _max: { order: true },
        }))?._max.order ?? -1) + 1;
        const created = await this.prisma.question.create({
            data: {
                interfaceId,
                dimension: dto.dimension,
                type: dto.type,
                prompt: dto.prompt,
                helpText: dto.helpText,
                isRequired: dto.isRequired ?? true,
                weight: dto.weight ?? 1,
                order,
            },
        });
        await this.logEvent({
            user,
            evaluationId: intf.evaluationId,
            action: 'CREATE',
            entityType: 'Question',
            entityId: created.id,
            data: { interfaceId, dimension: created.dimension, type: created.type },
        });
        return created;
    }
    async addTask(user, interfaceId, dto) {
        const intf = await this.prisma.interface.findUnique({
            where: { id: interfaceId },
            select: { evaluationId: true },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        await this.assertCanManageEvaluation(user, intf.evaluationId);
        const order = dto.order ??
            ((await this.prisma.task.aggregate({
                where: { interfaceId },
                _max: { order: true },
            }))?._max.order ?? -1) + 1;
        const created = await this.prisma.task.create({
            data: {
                interfaceId,
                title: dto.title,
                description: dto.description,
                targetTimeSec: dto.targetTimeSec,
                targetSteps: dto.targetSteps,
                order,
            },
        });
        await this.logEvent({
            user,
            evaluationId: intf.evaluationId,
            action: 'CREATE',
            entityType: 'Task',
            entityId: created.id,
            data: { interfaceId, title: created.title, order: created.order },
        });
        return created;
    }
    async updateInterface(user, interfaceId, dto) {
        const intf = await this.prisma.interface.findUnique({
            where: { id: interfaceId },
            select: { id: true, evaluationId: true, order: true },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        await this.assertCanManageEvaluation(user, intf.evaluationId);
        const nextName = dto.name?.trim();
        const nextImageUrl = dto.imageUrl === undefined
            ? undefined
            : dto.imageUrl.trim()
                ? dto.imageUrl.trim()
                : null;
        const nextPrototypeUrl = dto.prototypeUrl === undefined
            ? undefined
            : dto.prototypeUrl.trim()
                ? dto.prototypeUrl.trim()
                : null;
        const swapOrder = dto.order !== undefined && dto.order !== intf.order;
        const tempOrder = -1_000_000;
        const updated = await this.prisma.$transaction(async (tx) => {
            if (!swapOrder) {
                return tx.interface.update({
                    where: { id: interfaceId },
                    data: {
                        name: nextName ?? undefined,
                        imageUrl: nextImageUrl,
                        prototypeUrl: nextPrototypeUrl,
                    },
                });
            }
            const other = await tx.interface.findFirst({
                where: { evaluationId: intf.evaluationId, order: dto.order },
                select: { id: true, order: true },
            });
            if (!other) {
                return tx.interface.update({
                    where: { id: interfaceId },
                    data: {
                        name: nextName ?? undefined,
                        imageUrl: nextImageUrl,
                        prototypeUrl: nextPrototypeUrl,
                        order: dto.order,
                    },
                });
            }
            await tx.interface.update({
                where: { id: interfaceId },
                data: { order: tempOrder },
            });
            await tx.interface.update({
                where: { id: other.id },
                data: { order: intf.order },
            });
            return tx.interface.update({
                where: { id: interfaceId },
                data: {
                    name: nextName ?? undefined,
                    imageUrl: nextImageUrl,
                    prototypeUrl: nextPrototypeUrl,
                    order: dto.order,
                },
            });
        });
        await this.logEvent({
            user,
            evaluationId: intf.evaluationId,
            action: 'UPDATE',
            entityType: 'Interface',
            entityId: updated.id,
            data: dto,
        });
        return updated;
    }
    async deleteInterface(user, interfaceId) {
        const intf = await this.prisma.interface.findUnique({
            where: { id: interfaceId },
            select: { id: true, evaluationId: true },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        await this.assertCanManageEvaluation(user, intf.evaluationId);
        await this.prisma.interface.delete({ where: { id: interfaceId } });
        await this.logEvent({
            user,
            evaluationId: intf.evaluationId,
            action: 'DELETE',
            entityType: 'Interface',
            entityId: interfaceId,
        });
        return { ok: true };
    }
    async updateTask(user, taskId, dto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                interfaceId: true,
                order: true,
                interface: { select: { evaluationId: true } },
            },
        });
        if (!task)
            throw new common_1.NotFoundException('Tarea no encontrada');
        await this.assertCanManageEvaluation(user, task.interface.evaluationId);
        const nextTitle = dto.title?.trim();
        const nextDescription = dto.description === undefined
            ? undefined
            : dto.description.trim()
                ? dto.description.trim()
                : null;
        const swapOrder = dto.order !== undefined && dto.order !== task.order;
        const tempOrder = -1_000_000;
        const updated = await this.prisma.$transaction(async (tx) => {
            if (!swapOrder) {
                return tx.task.update({
                    where: { id: taskId },
                    data: {
                        title: nextTitle ?? undefined,
                        description: nextDescription,
                        targetTimeSec: dto.targetTimeSec ?? undefined,
                        targetSteps: dto.targetSteps ?? undefined,
                    },
                });
            }
            const other = await tx.task.findFirst({
                where: { interfaceId: task.interfaceId, order: dto.order },
                select: { id: true, order: true },
            });
            if (!other) {
                return tx.task.update({
                    where: { id: taskId },
                    data: {
                        title: nextTitle ?? undefined,
                        description: nextDescription,
                        targetTimeSec: dto.targetTimeSec ?? undefined,
                        targetSteps: dto.targetSteps ?? undefined,
                        order: dto.order,
                    },
                });
            }
            await tx.task.update({
                where: { id: taskId },
                data: { order: tempOrder },
            });
            await tx.task.update({
                where: { id: other.id },
                data: { order: task.order },
            });
            return tx.task.update({
                where: { id: taskId },
                data: {
                    title: nextTitle ?? undefined,
                    description: nextDescription,
                    targetTimeSec: dto.targetTimeSec ?? undefined,
                    targetSteps: dto.targetSteps ?? undefined,
                    order: dto.order,
                },
            });
        });
        await this.logEvent({
            user,
            evaluationId: task.interface.evaluationId,
            action: 'UPDATE',
            entityType: 'Task',
            entityId: updated.id,
            data: dto,
        });
        return updated;
    }
    async deleteTask(user, taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { interface: { select: { evaluationId: true } } },
        });
        if (!task)
            throw new common_1.NotFoundException('Tarea no encontrada');
        await this.assertCanManageEvaluation(user, task.interface.evaluationId);
        await this.prisma.task.delete({ where: { id: taskId } });
        await this.logEvent({
            user,
            evaluationId: task.interface.evaluationId,
            action: 'DELETE',
            entityType: 'Task',
            entityId: taskId,
        });
        return { ok: true };
    }
    async updateQuestion(user, questionId, dto) {
        const q = await this.prisma.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                interfaceId: true,
                order: true,
                interface: { select: { evaluationId: true } },
            },
        });
        if (!q)
            throw new common_1.NotFoundException('Pregunta no encontrada');
        await this.assertCanManageEvaluation(user, q.interface.evaluationId);
        const nextPrompt = dto.prompt?.trim();
        const nextHelpText = dto.helpText === undefined
            ? undefined
            : dto.helpText.trim()
                ? dto.helpText.trim()
                : null;
        const swapOrder = dto.order !== undefined && dto.order !== q.order;
        const tempOrder = -1_000_000;
        const updated = await this.prisma.$transaction(async (tx) => {
            if (!swapOrder) {
                return tx.question.update({
                    where: { id: questionId },
                    data: {
                        dimension: dto.dimension ?? undefined,
                        type: dto.type ?? undefined,
                        prompt: nextPrompt ?? undefined,
                        helpText: nextHelpText,
                        isRequired: dto.isRequired ?? undefined,
                        weight: dto.weight ?? undefined,
                    },
                });
            }
            const other = await tx.question.findFirst({
                where: { interfaceId: q.interfaceId, order: dto.order },
                select: { id: true, order: true },
            });
            if (!other) {
                return tx.question.update({
                    where: { id: questionId },
                    data: {
                        dimension: dto.dimension ?? undefined,
                        type: dto.type ?? undefined,
                        prompt: nextPrompt ?? undefined,
                        helpText: nextHelpText,
                        isRequired: dto.isRequired ?? undefined,
                        weight: dto.weight ?? undefined,
                        order: dto.order,
                    },
                });
            }
            await tx.question.update({
                where: { id: questionId },
                data: { order: tempOrder },
            });
            await tx.question.update({
                where: { id: other.id },
                data: { order: q.order },
            });
            return tx.question.update({
                where: { id: questionId },
                data: {
                    dimension: dto.dimension ?? undefined,
                    type: dto.type ?? undefined,
                    prompt: nextPrompt ?? undefined,
                    helpText: nextHelpText,
                    isRequired: dto.isRequired ?? undefined,
                    weight: dto.weight ?? undefined,
                    order: dto.order,
                },
            });
        });
        await this.logEvent({
            user,
            evaluationId: q.interface.evaluationId,
            action: 'UPDATE',
            entityType: 'Question',
            entityId: updated.id,
            data: dto,
        });
        return updated;
    }
    async deleteQuestion(user, questionId) {
        const q = await this.prisma.question.findUnique({
            where: { id: questionId },
            select: { interface: { select: { evaluationId: true } } },
        });
        if (!q)
            throw new common_1.NotFoundException('Pregunta no encontrada');
        await this.assertCanManageEvaluation(user, q.interface.evaluationId);
        await this.prisma.question.delete({ where: { id: questionId } });
        await this.logEvent({
            user,
            evaluationId: q.interface.evaluationId,
            action: 'DELETE',
            entityType: 'Question',
            entityId: questionId,
        });
        return { ok: true };
    }
    async submitAnswers(user, evaluationId, dto) {
        await this.assertCanSubmitEvaluationData(user, evaluationId);
        const intf = await this.prisma.interface.findUnique({
            where: { id: dto.interfaceId },
            select: {
                id: true,
                evaluationId: true,
                questions: {
                    select: { id: true, type: true, isRequired: true },
                },
            },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        if (intf.evaluationId !== evaluationId) {
            throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
        }
        const existingAnswersCount = await this.prisma.answer.count({
            where: {
                evaluationId,
                evaluatorId: user.userId,
                interfaceId: dto.interfaceId,
            },
        });
        if (existingAnswersCount > 0) {
            throw new common_1.ConflictException('Las respuestas para esta interfaz ya fueron guardadas y no se pueden modificar.');
        }
        await this.prisma.interfaceSelection.upsert({
            where: {
                evaluationId_evaluatorId: { evaluationId, evaluatorId: user.userId },
            },
            update: { interfaceId: dto.interfaceId },
            create: {
                evaluationId,
                evaluatorId: user.userId,
                interfaceId: dto.interfaceId,
            },
        });
        const questionById = new Map(intf.questions.map((q) => [q.id, q]));
        const missingRequired = intf.questions
            .filter((q) => q.isRequired)
            .filter((q) => !dto.answers.some((a) => a.questionId === q.id));
        if (missingRequired.length > 0) {
            throw new common_1.BadRequestException('Faltan respuestas obligatorias');
        }
        const rows = dto.answers.map((a) => {
            const q = questionById.get(a.questionId);
            if (!q) {
                throw new common_1.BadRequestException('Pregunta inválida');
            }
            const valueLikert = a.valueLikert ?? null;
            const valueNumber = a.valueNumber ?? null;
            const valueBoolean = a.valueBoolean ?? null;
            const valueText = a.valueText ?? null;
            if (q.type === client_1.QuestionType.LIKERT_1_5 && valueLikert === null) {
                throw new common_1.BadRequestException('Respuesta Likert requerida');
            }
            if (q.type === client_1.QuestionType.NUMBER && valueNumber === null) {
                throw new common_1.BadRequestException('Respuesta numérica requerida');
            }
            if (q.type === client_1.QuestionType.BOOLEAN && valueBoolean === null) {
                throw new common_1.BadRequestException('Respuesta booleana requerida');
            }
            if (q.type === client_1.QuestionType.TEXT && valueText === null) {
                throw new common_1.BadRequestException('Respuesta de texto requerida');
            }
            return {
                evaluationId,
                interfaceId: dto.interfaceId,
                questionId: a.questionId,
                evaluatorId: user.userId,
                valueNumber,
                valueLikert,
                valueBoolean,
                valueText,
            };
        });
        await this.prisma.answer.createMany({ data: rows });
        await this.prisma.evaluation.update({
            where: { id: evaluationId },
            data: { status: client_1.EvaluationStatus.IN_PROGRESS },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'UPSERT',
            entityType: 'Answer',
            data: { interfaceId: dto.interfaceId, count: dto.answers.length },
        });
        return { ok: true };
    }
    async getMyAnswers(user, evaluationId, interfaceId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const intf = await this.prisma.interface.findUnique({
            where: { id: interfaceId },
            select: { id: true, evaluationId: true },
        });
        if (!intf)
            throw new common_1.NotFoundException('Interfaz no encontrada');
        if (intf.evaluationId !== evaluationId) {
            throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
        }
        const answers = await this.prisma.answer.findMany({
            where: {
                evaluationId,
                interfaceId,
                evaluatorId: user.userId,
            },
            select: {
                questionId: true,
                valueLikert: true,
                valueNumber: true,
                valueBoolean: true,
                valueText: true,
            },
            orderBy: { questionId: 'asc' },
        });
        return { interfaceId, answers };
    }
    async submitTaskAttempt(user, evaluationId, dto) {
        await this.assertCanSubmitEvaluationData(user, evaluationId);
        const task = await this.prisma.task.findUnique({
            where: { id: dto.taskId },
            select: { id: true, interface: { select: { evaluationId: true } } },
        });
        if (!task)
            throw new common_1.NotFoundException('Tarea no encontrada');
        if (task.interface.evaluationId !== evaluationId) {
            throw new common_1.BadRequestException('Tarea no pertenece a la evaluación');
        }
        const errorsCount = dto.errorsCount ?? 0;
        await this.prisma.taskAttempt.upsert({
            where: {
                evaluationId_taskId_evaluatorId: {
                    evaluationId,
                    taskId: dto.taskId,
                    evaluatorId: user.userId,
                },
            },
            update: {
                completed: dto.completed,
                errorsCount,
                timeSec: dto.timeSec ?? null,
                stepsCount: dto.stepsCount ?? null,
                notes: dto.notes ?? null,
            },
            create: {
                evaluationId,
                taskId: dto.taskId,
                evaluatorId: user.userId,
                completed: dto.completed,
                errorsCount,
                timeSec: dto.timeSec ?? null,
                stepsCount: dto.stepsCount ?? null,
                notes: dto.notes ?? null,
            },
        });
        await this.prisma.evaluation.update({
            where: { id: evaluationId },
            data: { status: client_1.EvaluationStatus.IN_PROGRESS },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'UPSERT',
            entityType: 'TaskAttempt',
            data: { taskId: dto.taskId, completed: dto.completed, errorsCount },
        });
        return { ok: true };
    }
    async computeResults(user, evaluationId) {
        await this.assertCanManageEvaluation(user, evaluationId);
        const [meta, interfaces, answers] = await Promise.all([
            this.prisma.evaluation.findUnique({
                where: { id: evaluationId },
                select: {
                    scoringWeightEffectiveness: true,
                    scoringWeightEfficiency: true,
                    scoringWeightSatisfaction: true,
                },
            }),
            this.prisma.interface.findMany({
                where: { evaluationId },
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    name: true,
                    order: true,
                    questions: {
                        select: {
                            id: true,
                            dimension: true,
                            type: true,
                            weight: true,
                            prompt: true,
                        },
                    },
                },
            }),
            this.prisma.answer.findMany({
                where: { evaluationId },
                select: {
                    interfaceId: true,
                    questionId: true,
                    valueNumber: true,
                    valueLikert: true,
                    valueBoolean: true,
                },
            }),
        ]);
        if (!meta)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const wEff = meta.scoringWeightEffectiveness;
        const wEfi = meta.scoringWeightEfficiency;
        const wSat = meta.scoringWeightSatisfaction;
        const wSum = wEff + wEfi + wSat;
        if (interfaces.every((i) => i.questions.length === 0)) {
            throw new common_1.BadRequestException('La evaluación no tiene preguntas');
        }
        if (answers.length === 0) {
            throw new common_1.BadRequestException('Aún no hay respuestas registradas para calcular resultados');
        }
        const questionById = new Map();
        for (const intf of interfaces) {
            for (const q of intf.questions) {
                questionById.set(q.id, {
                    interfaceId: intf.id,
                    dimension: q.dimension,
                    type: q.type,
                    weight: q.weight,
                    prompt: q.prompt,
                });
            }
        }
        const answersByInterface = new Map();
        for (const a of answers) {
            const arr = answersByInterface.get(a.interfaceId) ?? [];
            arr.push({
                questionId: a.questionId,
                valueNumber: a.valueNumber,
                valueLikert: a.valueLikert,
                valueBoolean: a.valueBoolean,
            });
            answersByInterface.set(a.interfaceId, arr);
        }
        const computeForInterface = (interfaceId) => {
            const agg = new Map([
                [client_1.UsabilityDimension.EFFECTIVENESS, { sum: 0, weightSum: 0 }],
                [client_1.UsabilityDimension.EFFICIENCY, { sum: 0, weightSum: 0 }],
                [client_1.UsabilityDimension.SATISFACTION, { sum: 0, weightSum: 0 }],
            ]);
            let countedAnswers = 0;
            for (const a of answersByInterface.get(interfaceId) ?? []) {
                const q = questionById.get(a.questionId);
                if (!q)
                    continue;
                if (q.interfaceId !== interfaceId)
                    continue;
                const v = normalizeAnswer({
                    questionType: q.type,
                    dimension: q.dimension,
                    valueNumber: a.valueNumber,
                    valueLikert: a.valueLikert,
                    valueBoolean: a.valueBoolean,
                });
                if (v === null)
                    continue;
                countedAnswers += 1;
                const slot = agg.get(q.dimension);
                if (!slot)
                    continue;
                slot.sum += v * q.weight;
                slot.weightSum += q.weight;
            }
            const effectivenessScore = clamp01((agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.weightSum ?? 1));
            const efficiencyScore = clamp01((agg.get(client_1.UsabilityDimension.EFFICIENCY)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.EFFICIENCY)?.weightSum ?? 1));
            const satisfactionScore = clamp01((agg.get(client_1.UsabilityDimension.SATISFACTION)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.SATISFACTION)?.weightSum ?? 1));
            const overallScore = clamp01(wSum > 0
                ? (effectivenessScore * wEff +
                    efficiencyScore * wEfi +
                    satisfactionScore * wSat) /
                    wSum
                : (effectivenessScore + efficiencyScore + satisfactionScore) / 3);
            return {
                effectivenessScore,
                efficiencyScore,
                satisfactionScore,
                overallScore,
                totalAnswers: countedAnswers,
            };
        };
        const breakdown = interfaces.map((intf) => ({
            interfaceId: intf.id,
            interfaceName: intf.name,
            interfaceOrder: intf.order,
            ...computeForInterface(intf.id),
        }));
        const eligible = breakdown.filter((b) => b.totalAnswers > 0);
        if (eligible.length === 0) {
            throw new common_1.BadRequestException('Aún no hay respuestas registradas para calcular resultados');
        }
        const winner = [...eligible].sort((a, b) => {
            if (a.overallScore !== b.overallScore)
                return b.overallScore - a.overallScore;
            if (a.totalAnswers !== b.totalAnswers)
                return b.totalAnswers - a.totalAnswers;
            return a.interfaceOrder - b.interfaceOrder;
        })[0];
        const winnerInterfaceId = winner?.interfaceId ?? interfaces[0]?.id;
        const winnerInterfaceName = interfaces.find((i) => i.id === winnerInterfaceId)?.name ??
            `Interfaz ${winnerInterfaceId}`;
        const questionStats = new Map();
        for (const a of answersByInterface.get(winnerInterfaceId) ?? []) {
            const q = questionById.get(a.questionId);
            if (!q)
                continue;
            if (q.interfaceId !== winnerInterfaceId)
                continue;
            const v = normalizeAnswer({
                questionType: q.type,
                dimension: q.dimension,
                valueNumber: a.valueNumber,
                valueLikert: a.valueLikert,
                valueBoolean: a.valueBoolean,
            });
            if (v === null)
                continue;
            const slot = questionStats.get(a.questionId) ?? {
                dimension: q.dimension,
                prompt: q.prompt,
                sum: 0,
                count: 0,
            };
            slot.sum += v;
            slot.count += 1;
            questionStats.set(a.questionId, slot);
        }
        const effectivenessScore = winner.effectivenessScore;
        const efficiencyScore = winner.efficiencyScore;
        const satisfactionScore = winner.satisfactionScore;
        const overallScore = winner.overallScore;
        const conclusionsLines = [];
        const recLines = [];
        const addDimensionText = (dim, score, good, bad, recs) => {
            if (score >= 0.7)
                conclusionsLines.push(`${good} (${Math.round(score * 100)}%)`);
            else {
                conclusionsLines.push(`${bad} (${Math.round(score * 100)}%)`);
                recLines.push(...recs);
            }
        };
        addDimensionText(client_1.UsabilityDimension.EFFECTIVENESS, effectivenessScore, 'Efectividad adecuada: los usuarios logran el objetivo con pocos problemas', 'Efectividad baja: hay dificultad para lograr el objetivo o se presentan errores', [
            'Reducir la ambigüedad en etiquetas y llamadas a la acción',
            'Ajustar el flujo para evitar pasos que induzcan a error',
        ]);
        addDimensionText(client_1.UsabilityDimension.EFFICIENCY, efficiencyScore, 'Eficiencia adecuada: el esfuerzo para lograr el objetivo es razonable', 'Eficiencia baja: el flujo requiere demasiado esfuerzo, tiempo o pasos innecesarios', [
            'Eliminar pasos redundantes y agrupar acciones relacionadas',
            'Optimizar el orden de campos y priorizar lo más frecuente',
        ]);
        addDimensionText(client_1.UsabilityDimension.SATISFACTION, satisfactionScore, 'Satisfacción adecuada: la percepción de uso es positiva', 'Satisfacción baja: la experiencia genera frustración o falta de confianza', [
            'Mejorar feedback del sistema (estados, validaciones y confirmaciones)',
            'Mejorar consistencia visual y jerarquía de información',
        ]);
        const conclusions = [
            `Interfaz recomendada: ${winnerInterfaceName} (${Math.round(overallScore * 100)}%)`,
            ...conclusionsLines,
        ].join('\n');
        const recommendations = recLines.length === 0
            ? 'Mantener el diseño actual y monitorear con nuevas rondas de evaluación.'
            : Array.from(new Set(recLines)).join('\n');
        const worstQuestionPrompts = (dim, limit = 3) => {
            return Array.from(questionStats.values())
                .filter((s) => s.dimension === dim && s.count > 0)
                .sort((a, b) => a.sum / a.count - b.sum / b.count)
                .slice(0, limit)
                .map((s) => s.prompt);
        };
        const stories = [];
        if (effectivenessScore < 0.7) {
            stories.push({
                dimension: client_1.UsabilityDimension.EFFECTIVENESS,
                title: 'Prevención de errores y recuperación',
                narrative: 'Como usuario, quiero que la interfaz sea clara y me ayude a evitar errores para lograr el objetivo sin bloqueos.',
                acceptanceCriteria: [
                    '- Se validan entradas y se muestran mensajes accionables',
                    '- Se reduce la ambigüedad en etiquetas y llamadas a la acción',
                    ...worstQuestionPrompts(client_1.UsabilityDimension.EFFECTIVENESS).map((p) => `- Revisar pregunta: ${p}`),
                ].join('\n'),
                priority: 1,
            });
        }
        if (efficiencyScore < 0.7) {
            stories.push({
                dimension: client_1.UsabilityDimension.EFFICIENCY,
                title: 'Optimización del flujo',
                narrative: 'Como usuario, quiero lograr el objetivo con menos pasos y en menos tiempo para ahorrar esfuerzo.',
                acceptanceCriteria: [
                    '- Se eliminan pasos redundantes y se agrupan acciones relacionadas',
                    '- Se prioriza la información y acciones más frecuentes',
                    '- Se ofrece autocompletado o valores por defecto cuando aplique',
                ].join('\n'),
                priority: 2,
            });
        }
        if (satisfactionScore < 0.7) {
            stories.push({
                dimension: client_1.UsabilityDimension.SATISFACTION,
                title: 'Mejorar confianza y claridad visual',
                narrative: 'Como usuario, quiero recibir feedback inmediato y una interfaz consistente para sentir confianza al interactuar.',
                acceptanceCriteria: [
                    '- Indicadores de carga, éxito y error visibles',
                    '- Consistencia visual en componentes y jerarquía de información',
                    ...worstQuestionPrompts(client_1.UsabilityDimension.SATISFACTION).map((p) => `- Revisar pregunta: ${p}`),
                ].join('\n'),
                priority: 3,
            });
        }
        if (stories.length === 0) {
            stories.push({
                dimension: null,
                title: 'Monitoreo y mejora continua',
                narrative: 'Como equipo, queremos mantener la usabilidad alcanzada y detectar regresiones en nuevas versiones.',
                acceptanceCriteria: '- Repetir evaluación con nuevas muestras de usuarios\n- Comparar resultados por versión\n- Registrar incidencias y mejoras priorizadas',
                priority: 3,
            });
        }
        const result = await this.prisma.result.upsert({
            where: { evaluationId },
            update: {
                recommendedInterfaceId: winnerInterfaceId ?? null,
                effectivenessScore,
                efficiencyScore,
                satisfactionScore,
                overallScore,
                conclusions,
                recommendations,
            },
            create: {
                evaluationId,
                recommendedInterfaceId: winnerInterfaceId ?? null,
                effectivenessScore,
                efficiencyScore,
                satisfactionScore,
                overallScore,
                conclusions,
                recommendations,
            },
            include: { userStories: true },
        });
        await this.prisma.userStory.deleteMany({ where: { resultId: result.id } });
        const scoreForDim = (b, dim) => {
            if (dim === client_1.UsabilityDimension.EFFECTIVENESS)
                return b.effectivenessScore;
            if (dim === client_1.UsabilityDimension.EFFICIENCY)
                return b.efficiencyScore;
            return b.satisfactionScore;
        };
        const bestInterfaceIdForDimension = (dim) => {
            return [...eligible].sort((a, b) => {
                const sa = scoreForDim(a, dim);
                const sb = scoreForDim(b, dim);
                if (sa !== sb)
                    return sb - sa;
                if (a.totalAnswers !== b.totalAnswers)
                    return b.totalAnswers - a.totalAnswers;
                return a.interfaceOrder - b.interfaceOrder;
            })[0]?.interfaceId;
        };
        const createdStories = await this.prisma.userStory.createMany({
            data: stories.map((s) => ({
                resultId: result.id,
                title: s.title,
                narrative: s.narrative,
                acceptanceCriteria: s.acceptanceCriteria,
                priority: s.priority,
                recommendedInterfaceId: (s.dimension
                    ? bestInterfaceIdForDimension(s.dimension)
                    : winnerInterfaceId) ?? null,
            })),
        });
        await this.prisma.evaluation.update({
            where: { id: evaluationId },
            data: { status: client_1.EvaluationStatus.COMPLETED },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'COMPUTE',
            entityType: 'Result',
            entityId: result.id,
            data: {
                effectivenessScore,
                efficiencyScore,
                satisfactionScore,
                overallScore,
                userStoriesCreated: createdStories.count,
            },
        });
        return {
            result: await this.prisma.result.findUnique({
                where: { evaluationId },
                include: {
                    userStories: {
                        orderBy: { priority: 'asc' },
                        include: {
                            recommendedInterface: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            userStoriesCreated: createdStories.count,
        };
    }
    async listManualUserStories(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        return this.prisma.manualUserStory.findMany({
            where: { evaluationId },
            orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
            include: {
                interface: { select: { id: true, name: true } },
                recommendedInterface: { select: { id: true, name: true } },
                createdBy: { select: { id: true, email: true, fullName: true } },
            },
        });
    }
    async createManualUserStory(user, evaluationId, dto) {
        await this.assertCanManageEvaluation(user, evaluationId);
        if (dto.interfaceId !== undefined && dto.interfaceId !== null) {
            const intf = await this.prisma.interface.findUnique({
                where: { id: dto.interfaceId },
                select: { evaluationId: true },
            });
            if (!intf)
                throw new common_1.NotFoundException('Interfaz no encontrada');
            if (intf.evaluationId !== evaluationId) {
                throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
            }
        }
        if (dto.recommendedInterfaceId !== undefined &&
            dto.recommendedInterfaceId !== null) {
            const intf = await this.prisma.interface.findUnique({
                where: { id: dto.recommendedInterfaceId },
                select: { evaluationId: true },
            });
            if (!intf)
                throw new common_1.NotFoundException('Interfaz no encontrada');
            if (intf.evaluationId !== evaluationId) {
                throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
            }
        }
        const created = await this.prisma.manualUserStory.create({
            data: {
                evaluationId,
                interfaceId: dto.interfaceId ?? null,
                recommendedInterfaceId: dto.recommendedInterfaceId ?? null,
                createdById: user.userId,
                title: dto.title,
                narrative: dto.narrative,
                acceptanceCriteria: dto.acceptanceCriteria,
                status: dto.status ?? client_1.StoryStatus.DRAFT,
                mosCow: dto.mosCow ?? client_1.MoSCoWPriority.SHOULD,
                priority: dto.priority ?? 3,
                riceReach: dto.riceReach ?? null,
                riceImpact: dto.riceImpact ?? null,
                riceConfidence: dto.riceConfidence ?? null,
                riceEffort: dto.riceEffort ?? null,
            },
            include: {
                interface: { select: { id: true, name: true } },
                recommendedInterface: { select: { id: true, name: true } },
                createdBy: { select: { id: true, email: true, fullName: true } },
            },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'CREATE',
            entityType: 'ManualUserStory',
            entityId: created.id,
            data: {
                title: created.title,
                interfaceId: created.interfaceId,
                recommendedInterfaceId: created.recommendedInterfaceId,
            },
        });
        return created;
    }
    async updateManualUserStory(user, evaluationId, storyId, dto) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const story = await this.prisma.manualUserStory.findUnique({
            where: { id: storyId },
            select: {
                id: true,
                evaluationId: true,
                createdById: true,
                evaluation: { select: { createdById: true } },
            },
        });
        if (!story || story.evaluationId !== evaluationId) {
            throw new common_1.NotFoundException('Historia no encontrada');
        }
        const canEdit = user.role === client_1.RoleName.ADMIN ||
            story.evaluation.createdById === user.userId ||
            story.createdById === user.userId;
        if (!canEdit)
            throw new common_1.ForbiddenException();
        const triesToEditLockedFields = dto.title !== undefined ||
            dto.narrative !== undefined ||
            dto.acceptanceCriteria !== undefined ||
            dto.status !== undefined ||
            dto.mosCow !== undefined ||
            dto.priority !== undefined ||
            dto.riceReach !== undefined ||
            dto.riceImpact !== undefined ||
            dto.riceConfidence !== undefined ||
            dto.riceEffort !== undefined;
        if (triesToEditLockedFields) {
            throw new common_1.ConflictException('La historia ya fue registrada y no se pueden modificar sus campos. Solo se permite vincular interfaces.');
        }
        if (dto.interfaceId !== undefined && dto.interfaceId !== null) {
            const intf = await this.prisma.interface.findUnique({
                where: { id: dto.interfaceId },
                select: { evaluationId: true },
            });
            if (!intf)
                throw new common_1.NotFoundException('Interfaz no encontrada');
            if (intf.evaluationId !== evaluationId) {
                throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
            }
        }
        if (dto.recommendedInterfaceId !== undefined &&
            dto.recommendedInterfaceId !== null) {
            const intf = await this.prisma.interface.findUnique({
                where: { id: dto.recommendedInterfaceId },
                select: { evaluationId: true },
            });
            if (!intf)
                throw new common_1.NotFoundException('Interfaz no encontrada');
            if (intf.evaluationId !== evaluationId) {
                throw new common_1.BadRequestException('Interfaz no pertenece a la evaluación');
            }
        }
        const updated = await this.prisma.manualUserStory.update({
            where: { id: storyId },
            data: {
                interfaceId: dto.interfaceId ?? undefined,
                recommendedInterfaceId: dto.recommendedInterfaceId === null
                    ? null
                    : (dto.recommendedInterfaceId ?? undefined),
            },
            include: {
                interface: { select: { id: true, name: true } },
                recommendedInterface: { select: { id: true, name: true } },
                createdBy: { select: { id: true, email: true, fullName: true } },
            },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'UPDATE',
            entityType: 'ManualUserStory',
            entityId: updated.id,
            data: dto,
        });
        return updated;
    }
    async deleteManualUserStory(user, evaluationId, storyId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const story = await this.prisma.manualUserStory.findUnique({
            where: { id: storyId },
            select: {
                id: true,
                evaluationId: true,
                createdById: true,
                evaluation: { select: { createdById: true } },
            },
        });
        if (!story || story.evaluationId !== evaluationId) {
            throw new common_1.NotFoundException('Historia no encontrada');
        }
        const canDelete = user.role === client_1.RoleName.ADMIN ||
            story.evaluation.createdById === user.userId ||
            story.createdById === user.userId;
        if (!canDelete)
            throw new common_1.ForbiddenException();
        await this.prisma.manualUserStory.delete({ where: { id: storyId } });
        await this.logEvent({
            user,
            evaluationId,
            action: 'DELETE',
            entityType: 'ManualUserStory',
            entityId: storyId,
        });
        return { ok: true };
    }
    async listEvaluators(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        return this.prisma.evaluationEvaluator.findMany({
            where: { evaluationId },
            orderBy: { createdAt: 'asc' },
            include: {
                evaluator: { select: { id: true, email: true, fullName: true } },
            },
        });
    }
    async assignEvaluatorByEmail(user, evaluationId, email) {
        await this.assertCanManageEvaluation(user, evaluationId);
        const evaluator = await this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            select: { id: true, email: true, fullName: true },
        });
        if (!evaluator)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const created = await this.prisma.evaluationEvaluator.upsert({
            where: {
                evaluationId_evaluatorId: { evaluationId, evaluatorId: evaluator.id },
            },
            update: {},
            create: {
                evaluationId,
                evaluatorId: evaluator.id,
                assignedById: user.userId,
            },
            include: {
                evaluator: { select: { id: true, email: true, fullName: true } },
            },
        });
        await this.prisma.evaluation.updateMany({
            where: { id: evaluationId, status: client_1.EvaluationStatus.DRAFT },
            data: { status: client_1.EvaluationStatus.IN_PROGRESS },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'ASSIGN',
            entityType: 'EvaluationEvaluator',
            entityId: created.id,
            data: { evaluatorId: evaluator.id },
        });
        return created;
    }
    async removeEvaluator(user, evaluationId, evaluatorId) {
        await this.assertCanManageEvaluation(user, evaluationId);
        await this.prisma.evaluationEvaluator.delete({
            where: { evaluationId_evaluatorId: { evaluationId, evaluatorId } },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'UNASSIGN',
            entityType: 'EvaluationEvaluator',
            data: { evaluatorId },
        });
        return { ok: true };
    }
    async startSession(user, evaluationId) {
        await this.assertCanSubmitEvaluationData(user, evaluationId);
        await this.prisma.evaluationSession.updateMany({
            where: {
                evaluationId,
                evaluatorId: user.userId,
                status: client_1.SessionStatus.IN_PROGRESS,
            },
            data: { status: client_1.SessionStatus.COMPLETED, endedAt: new Date() },
        });
        const created = await this.prisma.evaluationSession.create({
            data: {
                evaluationId,
                evaluatorId: user.userId,
                status: client_1.SessionStatus.IN_PROGRESS,
            },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'START',
            entityType: 'EvaluationSession',
            entityId: created.id,
        });
        return created;
    }
    async endSession(user, evaluationId, notes) {
        await this.assertCanSubmitEvaluationData(user, evaluationId);
        const session = await this.prisma.evaluationSession.findFirst({
            where: {
                evaluationId,
                evaluatorId: user.userId,
                status: client_1.SessionStatus.IN_PROGRESS,
            },
            orderBy: { startedAt: 'desc' },
        });
        if (!session)
            throw new common_1.BadRequestException('No hay una sesión activa');
        const updated = await this.prisma.evaluationSession.update({
            where: { id: session.id },
            data: {
                status: client_1.SessionStatus.COMPLETED,
                endedAt: new Date(),
                notes: notes ?? null,
            },
        });
        await this.logEvent({
            user,
            evaluationId,
            action: 'END',
            entityType: 'EvaluationSession',
            entityId: updated.id,
        });
        return updated;
    }
    async computeMetrics(evaluationId, evaluatorId, scoringWeights) {
        const [questions, answers] = await Promise.all([
            this.prisma.question.findMany({
                where: { interface: { evaluationId } },
                select: {
                    id: true,
                    dimension: true,
                    type: true,
                    weight: true,
                },
            }),
            this.prisma.answer.findMany({
                where: {
                    evaluationId,
                    ...(evaluatorId ? { evaluatorId } : {}),
                },
                select: {
                    questionId: true,
                    valueNumber: true,
                    valueLikert: true,
                    valueBoolean: true,
                },
            }),
        ]);
        const questionById = new Map(questions.map((q) => [q.id, q]));
        const agg = new Map([
            [client_1.UsabilityDimension.EFFECTIVENESS, { sum: 0, weightSum: 0 }],
            [client_1.UsabilityDimension.EFFICIENCY, { sum: 0, weightSum: 0 }],
            [client_1.UsabilityDimension.SATISFACTION, { sum: 0, weightSum: 0 }],
        ]);
        let countedAnswers = 0;
        for (const a of answers) {
            const q = questionById.get(a.questionId);
            if (!q)
                continue;
            const v = normalizeAnswer({
                questionType: q.type,
                dimension: q.dimension,
                valueNumber: a.valueNumber,
                valueLikert: a.valueLikert,
                valueBoolean: a.valueBoolean,
            });
            if (v === null)
                continue;
            countedAnswers += 1;
            const slot = agg.get(q.dimension);
            if (!slot)
                continue;
            slot.sum += v * q.weight;
            slot.weightSum += q.weight;
        }
        const questionEffectiveness = clamp01((agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.sum ?? 0) /
            (agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.weightSum ?? 1));
        const questionEfficiency = clamp01((agg.get(client_1.UsabilityDimension.EFFICIENCY)?.sum ?? 0) /
            (agg.get(client_1.UsabilityDimension.EFFICIENCY)?.weightSum ?? 1));
        const satisfactionScore = clamp01((agg.get(client_1.UsabilityDimension.SATISFACTION)?.sum ?? 0) /
            (agg.get(client_1.UsabilityDimension.SATISFACTION)?.weightSum ?? 1));
        const effectivenessScore = questionEffectiveness;
        const efficiencyScore = questionEfficiency;
        const wEff = scoringWeights?.effectiveness ?? 1;
        const wEfi = scoringWeights?.efficiency ?? 1;
        const wSat = scoringWeights?.satisfaction ?? 1;
        const wSum = wEff + wEfi + wSat;
        const overallScore = clamp01(wSum > 0
            ? (effectivenessScore * wEff +
                efficiencyScore * wEfi +
                satisfactionScore * wSat) /
                wSum
            : (effectivenessScore + efficiencyScore + satisfactionScore) / 3);
        return {
            effectivenessScore,
            efficiencyScore,
            satisfactionScore,
            overallScore,
            totalAnswers: countedAnswers,
            totalAttempts: 0,
        };
    }
    async getResultsBreakdown(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const meta = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: {
                createdById: true,
                scoringWeightEffectiveness: true,
                scoringWeightEfficiency: true,
                scoringWeightSatisfaction: true,
            },
        });
        if (!meta)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const scoringWeights = {
            effectiveness: meta.scoringWeightEffectiveness,
            efficiency: meta.scoringWeightEfficiency,
            satisfaction: meta.scoringWeightSatisfaction,
        };
        const canSeeAll = user.role === client_1.RoleName.ADMIN || meta.createdById === user.userId;
        const evaluatorIds = new Set();
        if (canSeeAll) {
            const [assigned, answerDistinct, attemptDistinct] = await Promise.all([
                this.prisma.evaluationEvaluator.findMany({
                    where: { evaluationId },
                    select: { evaluatorId: true },
                }),
                this.prisma.answer.findMany({
                    where: { evaluationId },
                    distinct: ['evaluatorId'],
                    select: { evaluatorId: true },
                }),
                this.prisma.taskAttempt.findMany({
                    where: { evaluationId },
                    distinct: ['evaluatorId'],
                    select: { evaluatorId: true },
                }),
            ]);
            for (const x of assigned)
                evaluatorIds.add(x.evaluatorId);
            for (const x of answerDistinct)
                evaluatorIds.add(x.evaluatorId);
            for (const x of attemptDistinct)
                evaluatorIds.add(x.evaluatorId);
        }
        else {
            evaluatorIds.add(user.userId);
        }
        const ids = Array.from(evaluatorIds);
        const users = await this.prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, email: true, fullName: true },
        });
        const userById = new Map(users.map((u) => [u.id, u]));
        const breakdown = await Promise.all(ids.map(async (id) => {
            const metrics = await this.computeMetrics(evaluationId, id, scoringWeights);
            return {
                evaluatorId: id,
                evaluator: userById.get(id) ?? { id, email: null, fullName: null },
                ...metrics,
            };
        }));
        const aggregate = await this.computeMetrics(evaluationId, undefined, scoringWeights);
        const scores = {
            effectiveness: breakdown.map((b) => b.effectivenessScore),
            efficiency: breakdown.map((b) => b.efficiencyScore),
            satisfaction: breakdown.map((b) => b.satisfactionScore),
            overall: breakdown.map((b) => b.overallScore),
        };
        const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
        const median = (xs) => {
            if (xs.length === 0)
                return 0;
            const sorted = [...xs].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            if (sorted.length % 2 === 1)
                return sorted[mid] ?? 0;
            return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
        };
        const evaluatorsSummary = {
            count: breakdown.length,
            average: {
                effectivenessScore: avg(scores.effectiveness),
                efficiencyScore: avg(scores.efficiency),
                satisfactionScore: avg(scores.satisfaction),
                overallScore: avg(scores.overall),
            },
            median: {
                effectivenessScore: median(scores.effectiveness),
                efficiencyScore: median(scores.efficiency),
                satisfactionScore: median(scores.satisfaction),
                overallScore: median(scores.overall),
            },
        };
        return { canSeeAll, breakdown, aggregate, evaluatorsSummary };
    }
    async getInterfaceBreakdown(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const meta = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: {
                createdById: true,
                scoringWeightEffectiveness: true,
                scoringWeightEfficiency: true,
                scoringWeightSatisfaction: true,
            },
        });
        if (!meta)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const wEff = meta.scoringWeightEffectiveness;
        const wEfi = meta.scoringWeightEfficiency;
        const wSat = meta.scoringWeightSatisfaction;
        const wSum = wEff + wEfi + wSat;
        const canSeeAll = user.role === client_1.RoleName.ADMIN || meta.createdById === user.userId;
        const evaluatorFilter = canSeeAll ? {} : { evaluatorId: user.userId };
        const [interfaces, answers, selections] = await Promise.all([
            this.prisma.interface.findMany({
                where: { evaluationId },
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    name: true,
                    order: true,
                    questions: {
                        select: {
                            id: true,
                            dimension: true,
                            type: true,
                            weight: true,
                        },
                    },
                },
            }),
            this.prisma.answer.findMany({
                where: { evaluationId, ...evaluatorFilter },
                select: {
                    interfaceId: true,
                    questionId: true,
                    valueNumber: true,
                    valueLikert: true,
                    valueBoolean: true,
                },
            }),
            this.prisma.interfaceSelection.findMany({
                where: { evaluationId, ...evaluatorFilter },
                select: { interfaceId: true },
            }),
        ]);
        const questionById = new Map();
        for (const intf of interfaces) {
            for (const q of intf.questions) {
                questionById.set(q.id, {
                    dimension: q.dimension,
                    type: q.type,
                    weight: q.weight,
                    interfaceId: intf.id,
                });
            }
        }
        const selectionCountByInterface = new Map();
        for (const s of selections) {
            selectionCountByInterface.set(s.interfaceId, (selectionCountByInterface.get(s.interfaceId) ?? 0) + 1);
        }
        const answersByInterface = new Map();
        for (const a of answers) {
            const arr = answersByInterface.get(a.interfaceId) ?? [];
            arr.push({
                questionId: a.questionId,
                valueNumber: a.valueNumber,
                valueLikert: a.valueLikert,
                valueBoolean: a.valueBoolean,
            });
            answersByInterface.set(a.interfaceId, arr);
        }
        const computeForInterface = (interfaceId) => {
            const agg = new Map([
                [client_1.UsabilityDimension.EFFECTIVENESS, { sum: 0, weightSum: 0 }],
                [client_1.UsabilityDimension.EFFICIENCY, { sum: 0, weightSum: 0 }],
                [client_1.UsabilityDimension.SATISFACTION, { sum: 0, weightSum: 0 }],
            ]);
            let countedAnswers = 0;
            for (const a of answersByInterface.get(interfaceId) ?? []) {
                const q = questionById.get(a.questionId);
                if (!q)
                    continue;
                const v = normalizeAnswer({
                    questionType: q.type,
                    dimension: q.dimension,
                    valueNumber: a.valueNumber,
                    valueLikert: a.valueLikert,
                    valueBoolean: a.valueBoolean,
                });
                if (v === null)
                    continue;
                countedAnswers += 1;
                const slot = agg.get(q.dimension);
                if (!slot)
                    continue;
                slot.sum += v * q.weight;
                slot.weightSum += q.weight;
            }
            const questionEffectiveness = clamp01((agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.weightSum ?? 1));
            const questionEfficiency = clamp01((agg.get(client_1.UsabilityDimension.EFFICIENCY)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.EFFICIENCY)?.weightSum ?? 1));
            const satisfactionScore = clamp01((agg.get(client_1.UsabilityDimension.SATISFACTION)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.SATISFACTION)?.weightSum ?? 1));
            const effectivenessScore = questionEffectiveness;
            const efficiencyScore = questionEfficiency;
            const overallScore = clamp01(wSum > 0
                ? (effectivenessScore * wEff +
                    efficiencyScore * wEfi +
                    satisfactionScore * wSat) /
                    wSum
                : (effectivenessScore + efficiencyScore + satisfactionScore) / 3);
            return {
                effectivenessScore,
                efficiencyScore,
                satisfactionScore,
                overallScore,
                totalAnswers: countedAnswers,
                totalAttempts: 0,
            };
        };
        const breakdown = interfaces.map((intf) => ({
            interfaceId: intf.id,
            interfaceName: intf.name,
            ...computeForInterface(intf.id),
            selectedCount: selectionCountByInterface.get(intf.id) ?? 0,
        }));
        const aggregate = (() => {
            const agg = new Map([
                [client_1.UsabilityDimension.EFFECTIVENESS, { sum: 0, weightSum: 0 }],
                [client_1.UsabilityDimension.EFFICIENCY, { sum: 0, weightSum: 0 }],
                [client_1.UsabilityDimension.SATISFACTION, { sum: 0, weightSum: 0 }],
            ]);
            let countedAnswers = 0;
            for (const a of answers) {
                const q = questionById.get(a.questionId);
                if (!q)
                    continue;
                const v = normalizeAnswer({
                    questionType: q.type,
                    dimension: q.dimension,
                    valueNumber: a.valueNumber,
                    valueLikert: a.valueLikert,
                    valueBoolean: a.valueBoolean,
                });
                if (v === null)
                    continue;
                countedAnswers += 1;
                const slot = agg.get(q.dimension);
                if (!slot)
                    continue;
                slot.sum += v * q.weight;
                slot.weightSum += q.weight;
            }
            const questionEffectiveness = clamp01((agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.EFFECTIVENESS)?.weightSum ?? 1));
            const questionEfficiency = clamp01((agg.get(client_1.UsabilityDimension.EFFICIENCY)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.EFFICIENCY)?.weightSum ?? 1));
            const satisfactionScore = clamp01((agg.get(client_1.UsabilityDimension.SATISFACTION)?.sum ?? 0) /
                (agg.get(client_1.UsabilityDimension.SATISFACTION)?.weightSum ?? 1));
            const effectivenessScore = questionEffectiveness;
            const efficiencyScore = questionEfficiency;
            const overallScore = clamp01(wSum > 0
                ? (effectivenessScore * wEff +
                    efficiencyScore * wEfi +
                    satisfactionScore * wSat) /
                    wSum
                : (effectivenessScore + efficiencyScore + satisfactionScore) / 3);
            return {
                effectivenessScore,
                efficiencyScore,
                satisfactionScore,
                overallScore,
                totalAnswers: countedAnswers,
                totalAttempts: 0,
            };
        })();
        return { canSeeAll, breakdown, aggregate };
    }
    async getCompleteness(user, evaluationId) {
        await this.assertCanViewEvaluation(user, evaluationId);
        const meta = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
            select: { createdById: true },
        });
        if (!meta)
            throw new common_1.NotFoundException('Evaluación no encontrada');
        const canSeeAll = user.role === client_1.RoleName.ADMIN || meta.createdById === user.userId;
        const evaluatorIds = new Set();
        if (canSeeAll) {
            const [assigned, answerDistinct, selectionDistinct] = await Promise.all([
                this.prisma.evaluationEvaluator.findMany({
                    where: { evaluationId },
                    select: { evaluatorId: true },
                }),
                this.prisma.answer.findMany({
                    where: { evaluationId },
                    distinct: ['evaluatorId'],
                    select: { evaluatorId: true },
                }),
                this.prisma.interfaceSelection.findMany({
                    where: { evaluationId },
                    distinct: ['evaluatorId'],
                    select: { evaluatorId: true },
                }),
            ]);
            for (const x of assigned)
                evaluatorIds.add(x.evaluatorId);
            for (const x of answerDistinct)
                evaluatorIds.add(x.evaluatorId);
            for (const x of selectionDistinct)
                evaluatorIds.add(x.evaluatorId);
        }
        else {
            evaluatorIds.add(user.userId);
        }
        const ids = Array.from(evaluatorIds);
        const [users, interfaces, selectionRows, answerRows, totalAnswers] = await Promise.all([
            this.prisma.user.findMany({
                where: { id: { in: ids } },
                select: { id: true, email: true, fullName: true },
            }),
            this.prisma.interface.findMany({
                where: { evaluationId },
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    name: true,
                    questions: {
                        orderBy: { order: 'asc' },
                        select: { id: true, prompt: true, isRequired: true },
                    },
                },
            }),
            this.prisma.interfaceSelection.findMany({
                where: { evaluationId, evaluatorId: { in: ids } },
                select: { evaluatorId: true, interfaceId: true },
            }),
            this.prisma.answer.findMany({
                where: { evaluationId, evaluatorId: { in: ids } },
                select: { evaluatorId: true, questionId: true },
            }),
            this.prisma.answer.count({ where: { evaluationId } }),
        ]);
        const userById = new Map(users.map((u) => [u.id, u]));
        const answerKey = (evaluatorId, questionId) => `${evaluatorId}:${questionId}`;
        const answered = new Set(answerRows.map((r) => answerKey(r.evaluatorId, r.questionId)));
        const requiredQuestionsByInterfaceId = new Map();
        for (const intf of interfaces) {
            requiredQuestionsByInterfaceId.set(intf.id, intf.questions
                .filter((q) => q.isRequired)
                .map((q) => ({ questionId: q.id, prompt: q.prompt })));
        }
        const interfaceById = new Map(interfaces.map((i) => [i.id, i]));
        const selectionByEvaluatorId = new Map(selectionRows.map((s) => [s.evaluatorId, s.interfaceId]));
        const MAX_ITEMS = 12;
        const evaluators = ids.map((id) => {
            const selectedInterfaceId = selectionByEvaluatorId.get(id) ?? null;
            const selectedInterface = selectedInterfaceId
                ? (interfaceById.get(selectedInterfaceId) ?? null)
                : null;
            const required = selectedInterfaceId
                ? (requiredQuestionsByInterfaceId.get(selectedInterfaceId) ?? [])
                : [];
            const missingRequiredAnswersAll = required
                .filter((q) => !answered.has(answerKey(id, q.questionId)))
                .map((q) => ({
                interfaceId: selectedInterfaceId ?? 0,
                interfaceName: selectedInterface?.name ?? 'Interfaz',
                questionId: q.questionId,
                prompt: q.prompt,
            }));
            return {
                evaluatorId: id,
                evaluator: userById.get(id) ?? { id, email: null, fullName: null },
                selection: selectedInterface
                    ? {
                        interfaceId: selectedInterface.id,
                        interfaceName: selectedInterface.name,
                    }
                    : null,
                missingRequiredAnswersCount: missingRequiredAnswersAll.length,
                missingRequiredAnswers: missingRequiredAnswersAll.slice(0, MAX_ITEMS),
            };
        });
        const hasAnyData = totalAnswers > 0;
        const hasStructure = interfaces.some((i) => i.questions.length > 0);
        const hasPending = evaluators.some((e) => e.selection === null || e.missingRequiredAnswersCount > 0);
        const readyToCompute = hasStructure && hasAnyData;
        return {
            canSeeAll,
            summary: {
                hasStructure,
                hasAnyData,
                totalAnswers,
                evaluatorsCount: evaluators.length,
                readyToCompute,
                hasPending,
            },
            evaluators,
        };
    }
    async listAudit(user, evaluationId) {
        await this.assertCanManageEvaluation(user, evaluationId);
        return this.prisma.auditLog.findMany({
            where: { evaluationId },
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { actor: { select: { id: true, email: true, fullName: true } } },
        });
    }
};
exports.EvaluationsService = EvaluationsService;
exports.EvaluationsService = EvaluationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EvaluationsService);
//# sourceMappingURL=evaluations.service.js.map