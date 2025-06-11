import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from 'src/customized/repository/entity';
import {
  ReconciliationSource,
  ReconciliationSourceDocument,
} from './reconciliation-source.schema';

@Injectable()
export class ReconciliationSourceRepository extends EntityRepository<ReconciliationSourceDocument> {
  constructor(
    @InjectModel(ReconciliationSource.name)
    private readonly userModel: Model<ReconciliationSourceDocument>,
  ) {
    super(userModel);
  }

  //   async find(filter = {}, sort = {}): Promise<ReconciliationSourceDocument[]> {
  //     return this.userModel.find(filter).sort(sort).exec();
  //   }
}
