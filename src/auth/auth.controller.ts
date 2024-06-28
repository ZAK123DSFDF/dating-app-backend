import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Response,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LoginDto } from './login-dto/login.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { SignupDto } from './signup-dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UpdateDto } from './update-dto/update.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private jwt: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  @Post('login')
  async login(@Request() req, @Response() res, @Body() LoginDto: LoginDto) {
    try {
      const { user, token } = await this.auth.validateUser(LoginDto);
      // res.cookie('token', token, { httpOnly: true, secure: true });
      res.status(200).json({
        message: 'login successful',
        id: user.id,
        email: user.email,
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
  @Post('signup')
  @UseInterceptors(FileInterceptor('ProfilePic'))
  async signup(
    @Response() res,
    @UploadedFile() File: Express.Multer.File,
    @Body()
    signupDto: SignupDto,
  ) {
    try {
      const profilePicResult = await this.cloudinaryService.uploadFile(File);
      const { user, token } = await this.auth.createUser(
        signupDto,
        profilePicResult.secure_url,
        profilePicResult.public_id,
      );
      res.cookie('token', token, { httpOnly: true });
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json(error.message);
    }
  }
  @Patch('signup/image')
  @UseInterceptors(FilesInterceptor('Picture'))
  async signupImage(
    @Request() req,
    @Response() res,
    @UploadedFiles() Files: Express.Multer.File[],
  ) {
    try {
      const PicUrl = [];
      const PicPublic = [];
      for (const file of Files) {
        const Picture = await this.cloudinaryService.uploadFiles(file);
        PicUrl.push(Picture.secure_url);
        PicPublic.push(Picture.public_id);
      }
      const id = this.jwt.decode(req.cookies['token']).user;
      const updatedpro = await this.auth.createUserImage(id, PicUrl, PicPublic);
      res.status(200).json(updatedpro);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Get('logout')
  async logout(@Response() res) {
    try {
      // res.clearCookie('token');
      console.log('logout successful');
      res.status(200).json({
        message: 'logout successful',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  async isAuthenticated(@Request() req, @Response() res) {
    try {
      const decode = this.jwt.decode(req.cookies['token']);
      res.status(200).json({
        isAuthenticated: true,
        id: decode.user,
        email: decode.email,
      });
    } catch (error) {
      console.log(error);
      res.status(401).json(error);
    }
  }
  @Get('allUsers')
  async getAllUsers(@Response() res): Promise<any> {
    try {
      const AllUsers = await this.auth.getAllUsers();
      res.status(200).json(AllUsers);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Request() req, @Response() res): Promise<any> {
    try {
      const id = this.jwt.decode(req.cookies['token']).user;
      const userProfile = await this.auth.getUserProfile(id);
      res.status(200).json(userProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json(error.message);
    }
  }
  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserProfileInfo(
    @Request() req,
    @Response() res,
    @Param('userId') userId: string,
  ): Promise<any> {
    try {
      const id = this.jwt.decode(req.cookies['token']).user;
      const userProfile = await this.auth.getUserProfileInfo(userId, id);
      res.status(200).json(userProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json(error.message);
    }
  }
  @Patch('profile/updateText/:userId')
  @UseGuards(JwtAuthGuard)
  async updateUserProfileText(
    @Param('userId') userId: string,
    @Request() req,
    @Response() res,
    @Body() updateDto: UpdateDto,
  ): Promise<any> {
    try {
      const { name, email, age } = updateDto;
      console.log('received controller');
      console.log('this is the file in the controller', name, email, age);
      const id = this.jwt.decode(req.cookies['token']).user;
      await this.auth.updateUserProfileText(id, userId, updateDto);
      res.status(200).json('profile updated successfully');
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Patch('update/profileImage/:userId')
  @UseInterceptors(FileInterceptor('ProfilePic'))
  @UseGuards(JwtAuthGuard)
  async updateUserProfile(
    @Param('userId') userId: string,
    @Request() req,
    @Response() res,
    @UploadedFile() File: Express.Multer.File,
    @Body() { oldProfilePicPublic },
  ) {
    try {
      const profilePicResult = await this.cloudinaryService.uploadFile(File);
      const id = this.jwt.decode(req.cookies['token']).user;

      await this.auth.updateUserProfile(
        id,
        userId,
        profilePicResult.secure_url,
        profilePicResult.public_id,
        oldProfilePicPublic,
      );
      res.status(200).json('profile updated successfully');
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }

  @Patch('delete/profileImage/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteProfileImage(
    @Param('userId') userId: string,
    @Request() req,
    @Response() res,
  ) {
    try {
      const id = this.jwt.decode(req.cookies['token']).user;
      await this.auth.deleteUserProfileImage(id, userId);
      res.status(200).json('Profile image deleted successfully');
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Patch('update/image/:userId/:imageIndex')
  @UseInterceptors(FilesInterceptor('Picture'))
  @UseGuards(JwtAuthGuard)
  async updateUserProfileImage(
    @Request() req,
    @Response() res,
    @Param('userId') userId: string,
    @Param('imageIndex') imageIndex: number,
    @UploadedFiles() Files: Express.Multer.File[],
  ) {
    try {
      if (!Files || Files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const file = Files[0];
      const Picture = await this.cloudinaryService.uploadFiles(file);
      const picUrl = Picture.secure_url;
      const picUrlPublic = Picture.public_id;

      const id = this.jwt.decode(req.cookies['token']).user;
      const updatedProfile = await this.auth.updateUserProfileImage(
        id,
        userId,
        imageIndex,
        picUrl,
        picUrlPublic,
      );

      res.status(200).json(updatedProfile);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Patch('delete/image/:userId/:imageIndex')
  @UseGuards(JwtAuthGuard)
  async deleteUserProfileImage(
    @Request() req,
    @Response() res,
    @Param('userId') userId: string,
    @Param('imageIndex') imageIndex: number,
  ) {
    try {
      const token = req.cookies['token'];
      const decodedToken = this.jwt.decode(token);
      const currentUserId = decodedToken['user'];

      const updatedProfile = await this.auth.deleteImage(
        userId,
        imageIndex,
        currentUserId,
      );
      res.status(200).json(updatedProfile);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Post('update/PictureImage/:userId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('Picture1'))
  async uploadPictures(
    @Param('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const picUrls: string[] = [];
    const picPublicIds: string[] = [];

    for (const file of files) {
      const picture = await this.cloudinaryService.uploadFiles(file);
      const picUrl = picture.secure_url;
      const picUrlPublic = picture.public_id;

      // Ensure picUrl and picUrlPublic are strings
      if (typeof picUrl !== 'string' || typeof picUrlPublic !== 'string') {
        throw new Error('Invalid URL or public ID format');
      }

      picUrls.push(picUrl);
      picPublicIds.push(picUrlPublic);
    }

    return await this.auth.uploadPictures(userId, picUrls, picPublicIds);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @Request() req,
    @Response() res,
    @Query('ageMin') ageMin: number,
    @Query('ageMax') ageMax: number,
    @Query('name') name: string,
  ) {
    try {
      const sex = this.jwt.decode(req.cookies['token']).sex;
      const targetSex = sex === 'M' ? 'F' : 'M';
      const users = await this.auth.SearchUser(targetSex, ageMin, ageMax, name);
      res.status(200).json(users);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  @Get('searchOnline')
  @UseGuards(JwtAuthGuard)
  async searchOnlineUsers(
    @Request() req,
    @Response() res,
    @Query('ageMin') ageMin: number,
    @Query('ageMax') ageMax: number,
    @Query('name') name: string,
  ) {
    try {
      const sex = this.jwt.decode(req.cookies['token']).sex;
      const targetSex = sex === 'M' ? 'F' : 'M';
      const users = await this.auth.SearchOnlineUser(
        targetSex,
        ageMin,
        ageMax,
        name,
      );
      res.status(200).json(users);
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
}
