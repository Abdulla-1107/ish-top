// src/audio/audio.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class AudioService {
  constructor(private config: ConfigService) {}

  async transcribeAudio(filePath: string): Promise<string> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('model', 'gpt-4o-transcribe');
    form.append('language', 'uz');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          Authorization: `Bearer ${this.config.get('API_KEY')}`,
          ...form.getHeaders(),
        },
      },
    );

    return response.data.text;
  }
}
