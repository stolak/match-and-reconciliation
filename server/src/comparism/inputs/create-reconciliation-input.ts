import { Field, InputType } from '@nestjs/graphql';
import { DynamicField } from 'src/customized/types/dynamic-variable';

@InputType()
export class CreateReconciliationInput {
  @Field({ nullable: true })
  @Field({ nullable: true })
  projectDescription?: string;

  @Field({ nullable: true })
  fileDescription?: string;

  @Field({ nullable: true })
  refId?: string;

  @Field({ nullable: true })
  isPrimary?: boolean;

  @Field(() => [DynamicField])
  dynamicFields: DynamicField[];
}
