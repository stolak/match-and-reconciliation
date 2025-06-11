import { Test, TestingModule } from '@nestjs/testing';
import { ComparismService } from './comparism.service';

describe('ComparismService', () => {
  let service: ComparismService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComparismService],
    }).compile();

    service = module.get<ComparismService>(ComparismService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
