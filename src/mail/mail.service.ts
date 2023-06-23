import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Otp, OtpDocument } from './otp.model';
import { User, UserDocument } from 'src/user/user.model';
import { Model } from 'mongoose';
import { compare, genSalt, hash } from 'bcryptjs';

@Injectable()
export class MailService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    SendGrid.setApiKey(this.configService.get<string>('SEND_GRID_KEY'));
  }

  async sendOtpVerification(email: string) {
    if (!email) throw new ForbiddenException('Email is required');

    const otp = Math.floor(100000 + Math.random() * 900000);
    const salt = await genSalt(10);
    const hashedOtp = await hash(String(otp), salt);

    const emailData = {
      to: email,
      subject: 'Verification email',
      from: 'turayev9496@gmail.com',
      html: `
      <h1>Verification Code: ${otp}</h1>
      `,
    };
    await this.otpModel.create({ email, otp: hashedOtp, expireAt: Date.now() + 3600000 });
    await SendGrid.send(emailData);
    return 'Success';
  }

  async verifyOtp(email: string, otpVerification: string) {
    if (!otpVerification) throw new BadRequestException('Please send OTP Verification code');

    const userExistOtp = await this.otpModel.find({ email });
    const { expireAt, otp } = userExistOtp.slice(-1)[0];

    if (expireAt < new Date()) {
      await this.otpModel.deleteMany({ email });
      throw new BadRequestException('Expire code');
    }

    const validOtp = await compare(otpVerification, otp);
    if (!validOtp)
      throw new BadRequestException(
        'OTP verification code is not correct, please check your email',
      );

    await this.otpModel.deleteMany({ email });

    return 'Success';
  }
}
