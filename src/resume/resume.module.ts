import { forwardRef, Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
