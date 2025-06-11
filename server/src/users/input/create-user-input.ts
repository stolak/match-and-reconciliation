import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field({ nullable: false })
  email: string;

  @Field({ nullable: false })
  password: string;

  @Field({ nullable: false })
  confirmPassword: string;

  @Field({ nullable: false })
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;
}
