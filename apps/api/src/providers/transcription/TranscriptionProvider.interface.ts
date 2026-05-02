export interface TranscriptResult {
  transcriptId: string
  status: 'pending' | 'active' | 'completed'
  provider: string
  text?: string
}

export interface TranscriptionProvider {
  start(roomId: string): Promise<TranscriptResult>
  stop(roomId: string): Promise<TranscriptResult>
  getStatus(roomId: string): Promise<TranscriptResult | null>
}
