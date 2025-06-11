import { Field, InterfaceType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BaseDocument = Base & Document;

@InterfaceType()
@Schema()
export class Base {
  _id?: Types.ObjectId;

  @Field()
  @Prop({ unique: true, index: true })
  id: string;

  @Field({ nullable: true })
  @Prop()
  updatedAt?: Date;

  @Field({ nullable: true })
  @Prop()
  createdAt?: Date;

  @Field({ nullable: true })
  @Prop()
  deleted?: boolean;

  @Field({ nullable: true })
  @Prop()
  deletedAt?: Date;
}

export const BaseSchema = SchemaFactory.createForClass(Base);
