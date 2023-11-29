import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 12);
    return this.appService.create({
      name,
      email,
      password: hashedPassword,
    });
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.appService.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('invalid credentials');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new BadRequestException('invalid credentials');
    }
    const jwt = await this.jwtService.signAsync({ id: user.id });
    response.cookie('jwt', jwt, { httpOnly: true });
    return {
      message: 'successfully logged in ',
      data: { access_token: jwt, refresh_token: jwt },
    };
    return {
      message: 'success',
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.appService.uploadFile(file);
  }

  @Post('refresh-token')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.appService.findOne({ where: { id: payload.id } });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const accessToken = await this.jwtService.signAsync({ id: user.id });

      response.cookie('jwt', accessToken, { httpOnly: true });

      return {
        message: 'Access token refreshed successfully',
        data: { access_token: accessToken },
      };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }
}
