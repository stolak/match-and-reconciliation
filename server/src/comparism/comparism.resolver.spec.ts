import { Test, TestingModule } from '@nestjs/testing';
import { ComparismResolver } from './comparism.resolver';

describe('ComparismResolver', () => {
  let resolver: ComparismResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComparismResolver],
    }).compile();

    resolver = module.get<ComparismResolver>(ComparismResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
