import { IsIn, IsString, MaxLength } from 'class-validator';

export type MeetingDocumentSection = 'agenda' | 'notes';

export const MEETING_DOCUMENT_MAX_LENGTH = 20_000;

export class UpdateMeetingDocumentDto {
  @IsIn(['agenda', 'notes'])
  section: MeetingDocumentSection;
  @IsString()
  @MaxLength(MEETING_DOCUMENT_MAX_LENGTH)
  content: string;
}