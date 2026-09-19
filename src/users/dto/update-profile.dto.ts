import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telephone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  locationCountry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  locationCity?: string;
}
