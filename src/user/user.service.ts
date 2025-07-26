import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpService } from 'src/otp/otp.service';
import { CreateUserDto } from './dto/register-user.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { UserQueryDto } from './dto/query-user.dto';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly jwt: JwtService,
    private readonly aiService: AiService,
  ) {}

  removeNullValues(obj: any): { [k: string]: unknown } {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== null),
    );
  }

  async findAll(query: UserQueryDto) {
    const {
      page = '1',
      limit = '10',
      search,
      role,
      createdAtFrom,
      createdAtTo,
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (search) {
      where.fullName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (role) {
      where.role = {
        contains: role,
        mode: 'insensitive',
      };
    }

    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) {
        where.createdAt.gte = new Date(createdAtFrom);
      }
      if (createdAtTo) {
        where.createdAt.lte = new Date(createdAtTo);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async requestOtp(phone: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { phone },
    });
    if (existingUser) {
      throw new BadRequestException(
        'Bu telefon raqami allaqachon ro‘yxatdan o‘tgan',
      );
    }
    return this.otpService.sendOtp(phone);
  }

  async verifyOtp(phone: string, code: string) {
    return this.otpService.verifyOtp(phone, code);
  }
  async register(dto: CreateUserDto) {
    const isVerified = await this.otpService.isPhoneVerified(dto.phone);
    // if (!isVerified) {
    //   throw new BadRequestException('Telefon raqami OTP bilan tasdiqlanmagan');
    // }

    const isCheckPhone = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });

    if (isCheckPhone) {
      throw new BadRequestException("Ushbu telefon raqam ro'yxatdan o'tilgan");
    }

    const registerUser = await this.prisma.user.create({
      data: dto,
    });

    await this.aiService.storeUserContext(registerUser.id, {
      fullName: dto.fullName,
      phone: dto.phone,
      lastname: dto.lastName,
      role: dto.role,
    });
    console.log('UserContext saqlandi:', registerUser.id);

    return { data: registerUser };
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });
    if (!user) {
      throw new NotFoundException('user topilmadi');
    }
    const token = this.jwt.sign({
      id: user.id,
      phone: user.phone,
    });
    return { token };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) {
      throw new NotFoundException('user topilmadi');
    }
    return { data: user };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) {
      throw new NotFoundException('user topilmadi');
    }
    const deleteUser = await this.prisma.user.delete({ where: { id } });
    return { data: deleteUser };
  }

  async me(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      include: { announcements: true },
    });
    if (!user) {
      throw new NotFoundException('user topilmadi');
    }
    return { data: user };
  }
}
