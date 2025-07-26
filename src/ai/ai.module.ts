import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AudioModule } from 'src/audio/audio.module';
import { ResumeModule } from 'src/resume/resume.module';

@Module({
  imports: [AudioModule, ResumeModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
