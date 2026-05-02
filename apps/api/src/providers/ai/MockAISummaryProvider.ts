import type { AISummaryProvider, MeetingSummaryResult } from './AISummaryProvider.interface'
import { db } from '../../db'

export class MockAISummaryProvider implements AISummaryProvider {
  async getSummary(roomId: string): Promise<MeetingSummaryResult> {
    const existing = await db.meetingSummary.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    })
    if (existing) {
      return {
        summaryId: existing.id,
        isMock: true,
        summary: existing.summary,
        decisions: existing.decisions,
        actionItems: existing.actionItems,
        questions: existing.questions,
      }
    }
    return {
      summaryId: '',
      isMock: true,
      summary: null,
      decisions: null,
      actionItems: null,
      questions: null,
    }
  }

  async generateSummary(roomId: string, _transcript: string): Promise<MeetingSummaryResult> {
    const summary = await db.meetingSummary.create({
      data: {
        roomId,
        summary: '[MOCK] Краткое изложение встречи появится здесь после подключения AI-провайдера.',
        decisions: '[MOCK] Принятые решения будут отображаться здесь.',
        actionItems: '[MOCK] Задачи и следующие шаги появятся здесь.',
        questions: '[MOCK] Открытые вопросы будут здесь.',
      },
    })
    return {
      summaryId: summary.id,
      isMock: true,
      summary: summary.summary,
      decisions: summary.decisions,
      actionItems: summary.actionItems,
      questions: summary.questions,
    }
  }
}
