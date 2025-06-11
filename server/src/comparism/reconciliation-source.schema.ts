import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Document } from 'mongoose';
import { Base } from 'src/customized/schema/base';
import { DynamicField } from 'src/customized/types/dynamic-variable';

export type ReconciliationSourceDocument = ReconciliationSource & Document;

@ObjectType({ implements: [Base] })
@Schema({ timestamps: true })
export class ReconciliationSource extends Base {
  @Field()
  @Prop({ required: true })
  id: string;

  @Field()
  @Prop({ required: true })
  projectDescription: string;

  @Field()
  @Prop({ required: true })
  fileDescription: string;

  @Field(() => [DynamicField])
  @Prop()
  dynamicFields: DynamicField[];

  @Field()
  @Prop({ required: true })
  comparismDetails: string;

  @Field()
  @Prop({ required: true })
  refId: string;

  @Field({ nullable: true })
  @Prop()
  matchId?: string[];

  @Field({ nullable: true })
  @Prop()
  status?: boolean;

  @Field({ nullable: true })
  @Prop({ default: true })
  isPrimary?: boolean;

  @Field({ nullable: false })
  @Prop({ required: true })
  userId: string;
}

export const ReconciliationSourceSchema =
  SchemaFactory.createForClass(ReconciliationSource);
