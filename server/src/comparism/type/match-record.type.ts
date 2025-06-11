import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
@InputType('MatchRecordType')
export class MatchRecord {
  @Field({ nullable: true })
  primaryRecord?: string;

  @Field({ nullable: true })
  secondaryRecord?: string;
}
