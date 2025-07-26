// src/resume/dto/create-resume.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResumeDto {
  @ApiProperty({ example: 'Sardor' })
  @IsString()
  @IsNotEmpty()
  name: string  ;

  @ApiPropertyOptional({ example: 25 })
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiProperty({ example: 'Toshkent' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'JavaScript, React, Node.js' })
  @IsString()
  @IsNotEmpty()
  skills: string;

  @ApiProperty({ example: 'Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
