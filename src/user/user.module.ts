import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'secret_token',
      signOptions: { expiresIn: '7d' },
    }),
    AiModule,
  ],
  controllers: [UserController],
  providers: [UserService, OtpService, PrismaService],
})
export class UserModule {}
