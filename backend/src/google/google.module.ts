import { Module } from '@nestjs/common';
import { GoogleMeetService } from './google-meet.service.js';

@Module({
  providers: [GoogleMeetService],
  exports: [GoogleMeetService],
})
export class GoogleModule {}
