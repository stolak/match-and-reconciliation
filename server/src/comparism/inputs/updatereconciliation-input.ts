import { Field, InputType } from '@nestjs/graphql';
import { DynamicField } from 'src/customized/types/dynamic-variable';

@InputType()
export class UpdateReconciliationInput {
  @Field()
  id: string;

  // @Field(() => [DynamicField])
  // dynamicField: DynamicField[];

  @Field({ nullable: true })
  matchId?: string[];

  @Field({ nullable: true })
  status?: boolean;
}
