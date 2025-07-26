import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { log } from 'console';

@Injectable()
export class AiService {
  private userContexts = new Map<string, any>();
  constructor(private readonly config: ConfigService) {}

  async transcribeAudio(filePath: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'gpt-4o-transcribe');

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('AI_KEY')}`,
            ...formData.getHeaders(),
          },
        },
      );

      return response.data.text;
    } catch (error) {
      console.error(
        'Transcribe xatolik:',
        error?.response?.data || error.message,
      );
      throw new Error('Transkriptsiya xatoligi');
    }
  }

  async storeUserContext(userId: string, data: any): Promise<void> {
    this.userContexts.set(userId, data);
  }

  async getUserContext(userId: string): Promise<any> {
    return this.userContexts.get(userId);
  }

  async askWithContext(userText: string, context: any): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `Siz 'Ishtopdim' platformasining AI yordamchisisiz.
    Foydalanuvchi haqida mavjud kontekst:
    - Ism: ${context?.fullName || ''}
    - Familya: ${context?.lastname || ''}
    - Telefon: ${context?.phone || ''}
    - Rol: ${context?.role || ''}
    
    Foydalanuvchidan resume uchun audio xabar keldi. Siz bu xabardan quyidagi ma'lumotlarni aniqlang:
    
    - Field (kasb yo‘nalishi)
    - Skills (ko‘nikmalar)
    - Age (foydalanuvchi necha yoshda?)
    
    Foydalanuvchi so‘zlarini **faqat** quyidagi JSON strukturasida qaytaring. **Hech qanday boshqa izoh, salom yoki matn bo‘lmasin.**
    
    {
      "name": "${context?.fullName || ''} ${context?.lastname || ''}",
      "field": "...",
      "skills": "...",
      "location": "",
      "age": 0,
      "phone": "${context?.phone || ''}"
    }
    
    Agar foydalanuvchi kerakli ma'lumotni aytmasa, u qiymatni bo‘sh string sifatida yuboring.`,
      },
      {
        role: 'user',
        content: userText,
      },
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('AI_KEY')}`,
        },
      },
    );

    const reply = response.data.choices?.[0]?.message?.content;
    console.log('GPT javobi:', reply);
    console.log(context, 'Context');

    return reply;
  }
  
}
