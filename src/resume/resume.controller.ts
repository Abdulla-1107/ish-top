import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { AiService } from 'src/ai/ai.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  create(@Req() req: Request, @Body() createResumeDto: CreateResumeDto) {
    const userId = req['user-id'];
    return this.resumeService.create(createResumeDto, userId);
  }

  @Get()
  findAll() {
    return this.resumeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resumeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResumeDto: UpdateResumeDto) {
    return this.resumeService.update(+id, updateResumeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resumeService.remove(+id);
  }
  @UseGuards(AuthGuard)
  @Post('from-voice')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Resume audio fayl yuboring (.mp3, .wav, .m4a)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  async createFromVoice(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file?.path) {
      throw new BadRequestException(
        'Fayl yuborilmadi yoki noto‘g‘ri formatda.',
      );
    }

    const userId = req['user-id'];
    console.log(userId, 'bormi');

    const transcript = await this.aiService.transcribeAudio(file.path);
    const userContext = await this.aiService.getUserContext(userId);
    const gptReply = await this.aiService.askWithContext(
      transcript,
      userContext,
    );

    let parsed;
    try {
      parsed = JSON.parse(gptReply);
      
    } catch (e) {
      throw new Error('AI noto‘g‘ri formatdagi JSON qaytardi: ' + gptReply);
    }

    const saved = await this.resumeService.create(parsed, userId);

    return {
      status: 'success',
      transcript,
      parsed,
      saved,
    };
  }
}
