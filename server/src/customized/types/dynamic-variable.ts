import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
@InputType('DynamicFieldType')
export class DynamicField {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  value?: string;
}
