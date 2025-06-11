import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Base } from 'src/customized/schema/base';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

export type UserDocument = User & Document;

@ObjectType({ implements: [Base] })
@Schema({ timestamps: true })
export class User extends Base {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
