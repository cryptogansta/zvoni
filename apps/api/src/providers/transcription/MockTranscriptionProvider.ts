import type { TranscriptionProvider, TranscriptResult } from './TranscriptionProvider.interface'
import { db } from '../../db'

export class MockTranscriptionProvider implements TranscriptionProvider {
  async start(roomId: string): Promise<TranscriptResult> {
    const existing = await db.meetingTranscript.findFirst({
      where: { roomId, status: { in: ['PENDING', 'ACTIVE'] } },
    })
    if (existing) {
      await db.meetingTranscript.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } })
      return { transcriptId: existing.id, status: 'active', provider: 'mock' }
    }
    const transcript = await db.meetingTranscript.create({
      data: { roomId, status: 'ACTIVE', provider: 'mock' },
    })
    return { transcriptId: transcript.id, status: 'active', provider: 'mock' }
  }

  async stop(roomId: string): Promise<TranscriptResult> {
    const transcript = await db.meetingTranscript.findFirst({
      where: { roomId, status: 'ACTIVE' },
    })
    if (!transcript) {
      return { transcriptId: '', status: 'completed', provider: 'mock' }
    }
    const updated = await db.meetingTranscript.update({
      where: { id: transcript.id },
      data: {
        status: 'COMPLETED',
        text: '[MOCK] Транскрипция будет доступна после подключения реального провайдера (Whisper, Deepgram, Yandex SpeechKit).',
      },
    })
    return { transcriptId: updated.id, status: 'completed', provider: 'mock', text: updated.text ?? undefined }
  }

  async getStatus(roomId: string): Promise<TranscriptResult | null> {
    const transcript = await db.meetingTranscript.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    })
    if (!transcript) return null
    return {
      transcriptId: transcript.id,
      status: transcript.status.toLowerCase() as TranscriptResult['status'],
      provider: transcript.provider,
      text: transcript.text ?? undefined,
    }
  }
}
