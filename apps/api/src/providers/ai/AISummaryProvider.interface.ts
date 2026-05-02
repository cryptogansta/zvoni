export interface MeetingSummaryResult {
  summaryId: string
  isMock: boolean
  summary: string | null
  decisions: string | null
  actionItems: string | null
  questions: string | null
}

export interface AISummaryProvider {
  getSummary(roomId: string): Promise<MeetingSummaryResult>
  generateSummary(roomId: string, transcript: string): Promise<MeetingSummaryResult>
}

export interface RealtimeSuggestionProvider {
  getSuggestions(context: string): Promise<string[]>
}
