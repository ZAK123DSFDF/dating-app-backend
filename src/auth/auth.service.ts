import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './login-dto/login.dto';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './signup-dto/signup.dto';
import { UpdateDto } from './update-dto/update.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cloudinary: CloudinaryService,
  ) {}
  async validateUser(LoginDto: LoginDto): Promise<any> {
    try {
      const { email, password } = LoginDto;
      console.log(email, password);
      if (!email) {
        throw new BadRequestException('Email is not found');
      }
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new NotFoundException('user not found');
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new BadRequestException('credentials not correct');
      }
      const token = this.jwt.sign(
        { user: user.id, email: user.email, sex: user.sex },
        { secret: process.env.secret },
      );
      return { user, token };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteImage(userId: string, imageIndex: number, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (currentUserId !== user.id) {
      throw new ForbiddenException('You can only edit your profile');
    }

    const imagePublicId = user.PicturePublic[imageIndex];

    if (!imagePublicId) {
      throw new BadRequestException('Image not found');
    }
    await this.cloudinary.deleteFile(imagePublicId);
    const updatedPictures = [...user.Picture];
    const updatedPublicIds = [...user.PicturePublic];
    updatedPictures.splice(imageIndex, 1);
    updatedPublicIds.splice(imageIndex, 1);

    const updatedProfile = await this.prisma.user.update({
      where: { id: userId },
      data: {
        Picture: updatedPictures,
        PicturePublic: updatedPublicIds,
      },
    });

    return updatedProfile;
  }

  async createUser(
    signupDto: SignupDto,
    ProfilePic: string,
    ProfilePicPublic: string,
  ): Promise<any> {
    try {
      const { name, email, password, age, sex } = signupDto;
      const existUser = await this.prisma.user.findUnique({ where: { email } });
      if (existUser) {
        throw new ConflictException('email already exist');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          age: +age,
          sex,
          ProfilePic,
          ProfilePicPublic,
        },
      });
      const token = this.jwt.sign(
        { user: user.id, email: user.email, sex: user.sex },
        { secret: process.env.secret },
      );
      return { user, token };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async createUserImage(userId: string, PicUrl: string[], PicPublic: string[]) {
    try {
      if (PicUrl.length !== PicPublic.length) {
        throw new Error(
          'Picture URLs and Public IDs must have the same length',
        );
      }
      const existinguser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!existinguser) {
        throw new Error('User not found');
      }
      const updatedPictures = [...existinguser.Picture, ...PicUrl];
      const updatedPublicIds = [...existinguser.PicturePublic, ...PicPublic];
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          Picture: updatedPictures,
          PicturePublic: updatedPublicIds,
        },
      });

      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async uploadPictures(
    userId: string,
    picUrls: string[],
    picPublicIds: string[],
  ) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Ensure picUrls and picPublicIds are arrays of strings
      const updatedPictures = [
        ...existingUser.Picture,
        ...picUrls.map((url) => String(url)),
      ];
      const updatedPublicIds = [
        ...existingUser.PicturePublic,
        ...picPublicIds.map((id) => String(id)),
      ];

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          Picture: updatedPictures,
          PicturePublic: updatedPublicIds,
        },
      });

      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  exclude<User, Key extends keyof User>(
    user: User,
    keys: Key[],
  ): Omit<User, Key> {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }
  async getUserProfile(id: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.exclude(user, ['password']);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async getUserProfileInfo(userId: string, id: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          chats: {
            where: {
              AND: [
                { participants: { some: { id: userId } } },
                { participants: { some: { id } } },
              ],
            },
          },
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async updateUserProfileText(
    id: string,
    userId: string,
    updateDto: UpdateDto,
  ): Promise<any> {
    const { name, email, age } = updateDto;
    console.log('this is the file', name, email, age);
    if (id !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to update this profile',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (email && email !== user.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailInUse) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (name && name !== user.name) {
      const nameInUse = await this.prisma.user.findFirst({
        where: {
          name,
        },
      });
      if (nameInUse) {
        throw new ConflictException('Name is already in use');
      }
    }
    const updatedProfile = await this.prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        age,
      },
    });
    console.log('received after', updatedProfile);
    return updatedProfile;
  }

  async updateUserProfile(
    id: string,
    userId: string,
    ProfilePic: string,
    ProfilePicPublic: string,
    oldProfilePicPublic1: string,
  ) {
    try {
      const User = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (id !== User.id) {
        throw new ForbiddenException('you can only edit your profile');
      }
      if (oldProfilePicPublic1) {
        await this.cloudinary.deleteFile(oldProfilePicPublic1);
      }
      const {
        ProfilePic: oldProfilePic,
        ProfilePicPublic: oldProfilePicPublic,
      } = User;
      const updatedProfile = await this.prisma.user.update({
        where: { id },
        data: {
          ProfilePic: ProfilePic ? ProfilePic : oldProfilePic,
          ProfilePicPublic: ProfilePicPublic
            ? ProfilePicPublic
            : oldProfilePicPublic,
        },
      });
      return updatedProfile;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async deleteUserProfileImage(id: string, userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (id !== userId) {
        throw new ForbiddenException('You can only edit your profile');
      }
      if (user.ProfilePicPublic) {
        await this.cloudinary.deleteFile(user.ProfilePicPublic);
      }

      const updatedProfile = await this.prisma.user.update({
        where: { id },
        data: {
          ProfilePic: '',
          ProfilePicPublic: '',
        },
      });
      console.log('updated ProfilePic', updatedProfile.ProfilePic);
      console.log('updated Public', updatedProfile.ProfilePicPublic);
      return updatedProfile;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async updateUserProfileImage(
    id: string,
    userId: string,
    imageIndex: number,
    picUrl: string,
    picUrlPublic: string,
  ) {
    try {
      const User = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (id !== User.id) {
        throw new ForbiddenException('You can only edit your profile');
      }
      const oldPublicId = User.PicturePublic[imageIndex];
      if (oldPublicId) {
        await this.cloudinary.deleteFile(oldPublicId);
      }
      const updatedPictures = [...User.Picture];
      const updatedPublicIds = [...User.PicturePublic];
      updatedPictures[imageIndex] = picUrl;
      updatedPublicIds[imageIndex] = picUrlPublic;

      const updatedProfile = await this.prisma.user.update({
        where: { id: userId },
        data: {
          Picture: updatedPictures,
          PicturePublic: updatedPublicIds,
        },
      });

      return updatedProfile;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async SearchUser(
    sex: 'M' | 'F',
    ageMin?: number,
    ageMax?: number,
    name?: string,
  ): Promise<any> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          AND: [
            { sex },
            ageMin ? { age: { gte: +ageMin } } : {},
            ageMax ? { age: { lte: +ageMax } } : {},
            name ? { name: { equals: name } } : {},
          ],
        },
      });
      return users;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async getAllUsers() {
    try {
      const Allusers = await this.prisma.user.findMany();
      return Allusers;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async SearchOnlineUser(
    sex: 'M' | 'F',
    ageMin?: number,
    ageMax?: number,
    name?: string,
  ): Promise<any> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          AND: [
            { sex },
            { status: 'ONLINE' },
            ageMin ? { age: { gte: +ageMin } } : {},
            ageMax ? { age: { lte: +ageMax } } : {},
            name ? { name: { equals: name } } : {},
          ],
        },
      });
      return users;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
