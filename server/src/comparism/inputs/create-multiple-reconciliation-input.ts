import { Field, InputType } from '@nestjs/graphql';
import { DynamicField } from 'src/customized/types/dynamic-variable';

@InputType()
export class CreateMultipleReconciliationInput {
  @Field({ nullable: true })
  projectDescription?: string;

  @Field({ nullable: true })
  fileDescription?: string;

  @Field({ nullable: true })
  refId?: string;

  @Field(() => [[DynamicField]])
  mutilpleDynamicFields: DynamicField[][];
}
