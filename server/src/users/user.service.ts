import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { CreateUserInput } from './input/create-user-input';
import { Error as MongooseError } from 'mongoose';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(user: CreateUserInput): Promise<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    _id: {};
  }> {
    try {
      // Check if passwords match
      if (user.password !== user.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Check if email already exists
      const existingUser = await this.findUserByEmail(user.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(user.password, 10);
      delete user.confirmPassword;

      const newUser = new this.userModel({
        ...user,
        password: hashedPassword,
        id: uuid(),
      });
      const savedUser = await newUser.save();
      const userObject = await this.userModel.findById(savedUser._id).lean();
      delete userObject.password;
      return userObject;
    } catch (error) {
      // Handle Mongoose validation errors
      if (error instanceof MongooseError.ValidationError) {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message,
        );
        throw new BadRequestException(
          `Validation failed: ${validationErrors.join(', ')}`,
        );
      }

      // Handle specific known errors
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Log other unexpected errors
      console.error('Error creating user:', error);
      throw new InternalServerErrorException(
        'An error occurred while creating the user',
      );
    }
  }
}
