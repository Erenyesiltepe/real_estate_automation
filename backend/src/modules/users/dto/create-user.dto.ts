import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Smith', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'secret123',
    description: 'Password (min 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.agent,
    description: 'Role assigned to the user',
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    example: '+905551234567',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
