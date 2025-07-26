// src/ai/ai.controller.ts

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { AiService } from './ai.service';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('voice')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Audio fayl yuboring (.mp3, .wav, .m4a)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async voice(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException(
        'Fayl yuborilmadi! Iltimos, audio fayl yuboring.',
      );
    }
    const userId = req['user-id'];
    const context = await this.aiService.getUserContext(userId);

    const transcript = await this.aiService.transcribeAudio(file.path);
    const aiReply = await this.aiService.askWithContext(transcript, context);

    return {
      status: 'success',
      transcript,
      aiReply,
    };
  }
}
