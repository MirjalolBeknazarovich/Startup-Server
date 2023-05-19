/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/user.model';
import { genSalt, hash, compare } from 'bcryptjs';
import { RegisterAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  [x: string]: any;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}
  async register(dto: RegisterAuthDto) {
    const existUser = await this.isExistUser(dto.email);
    if (existUser)
      throw new BadRequestException('User with that email is already exist in the system');

    const salt = await genSalt(10);
    const passwordHash = await hash(dto.password, salt);

    const newUser = await this.userModel.create({ ...dto, password: passwordHash });

    const token = await this.issueTokenPair(String(newUser._id));
    return { user: this.getUserField(newUser), ...token };
  }

  async login(dto: LoginAuthDto) {
    const existUser = await this.isExistUser(dto.email);
    if (!existUser) throw new BadRequestException('User not found');
    const currentPassword = await compare(dto.password, existUser.password);
    if (!currentPassword) throw new BadRequestException('Incorrect password');

    const token = await this.issueTokenPair(String(existUser._id));
    return { user: this.getUserField(existUser), ...token };
  }

  async isExistUser(email: string): Promise<UserDocument> {
    const existUser = await this.userModel.findOne({ email });
    return existUser;
  }

  async issueTokenPair(userId: string) {
    const data = { _id: userId };

    const refreshToken = await this.jwtService.signAsync(data, { expiresIn: '15d' });

    const accessToken = await this.jwtService.signAsync(data, { expiresIn: '1m' });

    return { refreshToken, accessToken };
  }

  getUserField(user: UserDocument) {
    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    };
  }
}
